import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';

@Injectable()

export class ChallengesService {
  constructor(private prisma: PrismaService) { }

  async create(data: Prisma.ChallengeCreateInput) {
    return this.prisma.challenge.create({ data });
  }

  async findAll() {
    return this.prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async findBySlug(slug: string) {
    const challenge = await (this.prisma.challenge as any).findUnique({
      where: { slug },
    });
    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }
    return {
      id: challenge.id,
      slug: challenge.slug,
      name: challenge.name,
      description: challenge.description,
      accountSize: challenge.accountSize,
      price: challenge.price,
      currency: challenge.currency,
      challengeType: challenge.challengeType,
      phase1TargetPercent: challenge.phase1TargetPercent,
      phase2TargetPercent: challenge.phase2TargetPercent,
      dailyDrawdownPercent: challenge.dailyDrawdownPercent,
      overallDrawdownPercent: challenge.overallDrawdownPercent,
      profitSplit: challenge.profitSplit,
      platform: challenge.platform,
    };
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

}
