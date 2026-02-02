import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ContactCategory, TicketStatus } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    // Create contact message in database
    const contactMessage = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        category: dto.category || ContactCategory.GENERAL,
        subject: dto.subject,
        message: dto.message,
        status: TicketStatus.OPEN,
      },
    });

    // Send confirmation email to user (async, don't wait)
    this.emailService
      .sendContactConfirmationEmail(dto.email, dto.name, dto.subject)
      .then((result) => {
        if (result.success) {
          this.logger.log(
            `Confirmation email sent to ${dto.email} (messageId: ${result.messageId})`,
          );
        } else {
          this.logger.warn(
            `Failed to send confirmation email to ${dto.email}: ${result.error}`,
          );
        }
      })
      .catch((error) => {
        this.logger.error(
          `Error sending confirmation email to ${dto.email}:`,
          error,
        );
      });

    // Send notification to support team (async, don't wait)
    this.emailService
      .sendContactNotificationToSupport(
        dto.name,
        dto.email,
        dto.category || ContactCategory.GENERAL,
        dto.subject,
        dto.message,
      )
      .then((result) => {
        if (result.success) {
          this.logger.log(
            `Support notification sent (messageId: ${result.messageId})`,
          );
        } else {
          this.logger.warn(
            `Failed to send support notification: ${result.error}`,
          );
        }
      })
      .catch((error) => {
        this.logger.error('Error sending support notification:', error);
      });

    return contactMessage;
  }

  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.contactMessage.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: TicketStatus) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    return this.prisma.contactMessage.delete({
      where: { id },
    });
  }
}
