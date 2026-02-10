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
