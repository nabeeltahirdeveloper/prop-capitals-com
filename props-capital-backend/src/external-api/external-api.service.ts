import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadStatus, LeadPriority, LeadOnlineStatus } from '@prisma/client';

@Injectable()
export class ExternalApiService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        personName: dto.personName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        country: dto.country,
        source: dto.source || 'API',
        leadStatus: dto.leadStatus || LeadStatus.NEW,
        onlineStatus: LeadOnlineStatus.OFFLINE,
        priority: dto.priority || LeadPriority.MEDIUM,
        age: dto.age,
        salary: dto.salary,
        jobIndustry: dto.jobIndustry,
        workTitle: dto.workTitle,
        affiliateId: dto.affiliateId,
        funnelName: dto.funnelName,
        subParameters: dto.subParameters,
      },
    });

    return {
      id: lead.id,
      personName: lead.personName,
      email: lead.email,
      status: lead.leadStatus,
      createdAt: lead.createdAt,
    };
  }

  async createLeadsBulk(dtos: CreateLeadDto[]) {
    const results: {
      id: string;
      personName: string;
      email: string;
      status: string;
      createdAt: Date;
    }[] = [];
    const errors: { index: number; email: string; error: string }[] = [];

    for (let i = 0; i < dtos.length; i++) {
      try {
        const lead = await this.createLead(dtos[i]);
        results.push(lead);
      } catch (error) {
        errors.push({
          index: i,
          email: dtos[i].email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total: dtos.length,
      created: results.length,
      failed: errors.length,
      leads: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async getLeadById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        personName: true,
        email: true,
        leadStatus: true,
        source: true,
        createdAt: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }
}
