import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';

import { toChallengeDto } from './dto/challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ChallengeCreateInput) {
    return this.prisma.challenge.create({ data });
  }

  async findAll() {
    const challenges = await this.prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return challenges.map(toChallengeDto);
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return toChallengeDto(challenge);
  }

  async findBySlug(slug: string) {
    let challenge: any = await (this.prisma.challenge as any).findUnique({
      where: { slug },
    });
    let brandAttribution: any = null;

    if (!challenge) {
      challenge = await this.prisma.challenge.findUnique({
        where: { id: slug },
      });
    }

    if (!challenge) {
      // Try brand direct purchase link
      const link = await (this.prisma as any).directPurchaseLink.findUnique({
        where: { slug },
        include: { brand: true, challenge: true },
      });
      if (link?.active && link.challenge?.isActive) {
        challenge = link.challenge;
        brandAttribution = {
          brand_id: link.brandId,
          brand_name: link.brand?.name ?? null,
          brand_slug: link.brand?.slug ?? null,
          link_id: link.id,
          link_slug: link.slug,
          link_name: link.name,
        };
        // Fire-and-forget click tracking — never block resolution
        (this.prisma as any).directPurchaseLink
          .update({
            where: { id: link.id },
            data: { clicks: { increment: 1 } },
          })
          .catch(() => undefined);
      }
    }

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }
    // Same canonical shape as the list endpoint, plus optional brand
    // attribution when the challenge was reached via a DirectPurchaseLink.
    return { ...toChallengeDto(challenge), brand: brandAttribution };
  }

  async update(id: string, data: Prisma.ChallengeUpdateInput) {
    await this.findOne(id); // check existence
    return this.prisma.challenge.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.challenge.delete({
      where: { id },
    });
  }

  async trackBrandLinkClick(slug: string) {
    if (!slug) return { success: true, tracked: false };
    try {
      await (this.prisma as any).directPurchaseLink.update({
        where: { slug },
        data: { clicks: { increment: 1 } },
      });
      return { success: true, tracked: true };
    } catch {
      // Slug not found, link inactive, or DB error — never block the caller
      return { success: true, tracked: false };
    }
  }
}
