import { PrismaClient, TicketStatus, SenderType } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_MAP: Partial<Record<TicketStatus, TicketStatus>> = {
  IN_PROGRESS: TicketStatus.WAITING_FOR_ADMIN,
  RESOLVED: TicketStatus.CLOSED,
};

async function backfill() {
  console.log('Starting ticket-message backfill...');

  const tickets = await prisma.supportTicket.findMany({
    include: { _count: { select: { messages: true } } },
  });

  let processed = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    if (ticket._count.messages > 0) {
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: SenderType.TRADER,
          senderId: ticket.userId,
          message: ticket.message,
          createdAt: ticket.createdAt,
        },
      });

      if (ticket.adminReply) {
        await tx.supportTicketMessage.create({
          data: {
            ticketId: ticket.id,
            senderType: SenderType.ADMIN,
            senderId: null,
            message: ticket.adminReply,
            createdAt: ticket.repliedAt ?? ticket.updatedAt,
          },
        });
      }

      const newStatus = STATUS_MAP[ticket.status];
      if (newStatus) {
        await tx.supportTicket.update({
          where: { id: ticket.id },
          data: { status: newStatus },
        });
      }
    });

    processed++;
  }

  console.log(`Backfill complete. Processed: ${processed}, Skipped (already had messages): ${skipped}`);
}

backfill()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
