import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';
import {
  LeadStatus,
  LeadOnlineStatus,
  PaymentMethod,
  PaymentProvider,
  LeadPriority,
  LeadActivityType,
} from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async getAllLeads(filters?: {
    status?: LeadStatus;
    search?: string;
    fromDate?: Date | string;
    toDate?: Date | string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.leadStatus = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { personName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { country: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.fromDate || filters?.toDate) {
      where.leadReceivedDate = {};
      if (filters?.fromDate) {
        const d = new Date(filters.fromDate);
        // Only set to start of day if it looks like a simple date string (YYYY-MM-DD)
        if (
          typeof filters.fromDate === 'string' &&
          filters.fromDate.length <= 10
        ) {
          d.setHours(0, 0, 0, 0);
        }
        where.leadReceivedDate.gte = d;
      }
      if (filters?.toDate) {
        const d = new Date(filters.toDate);
        // Only set to end of day if it looks like a simple date string (YYYY-MM-DD)
        if (typeof filters.toDate === 'string' && filters.toDate.length <= 10) {
          d.setHours(23, 59, 59, 999);
        }
        where.leadReceivedDate.lte = d;
      }
    }

    return this.prisma.lead.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Get last 10 activities
        },
      },
      orderBy: { leadReceivedDate: 'desc' },
    });
  }

  async getLeadById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async createLead(data: {
    personName: string;
    email: string;
    phoneNumber?: string;
    country?: string;
    source?: string;
    leadStatus?: LeadStatus;
    onlineStatus?: LeadOnlineStatus;
    leadReceivedDate?: Date;
    ftdAmount?: number;
    paymentMethod?: PaymentMethod;
    paymentProvider?: PaymentProvider;
    priority?: LeadPriority;
    assignedAgent?: string;
    age?: number;
    salary?: string;
    jobIndustry?: string;
    workTitle?: string;
    convertedAt?: Date;
    affiliateId?: string;
    funnelName?: string;
    subParameters?: string;
  }) {
    return this.prisma.lead.create({
      data: {
        personName: data.personName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
        source: data.source,
        leadStatus: data.leadStatus || LeadStatus.NEW,
        onlineStatus: data.onlineStatus || LeadOnlineStatus.OFFLINE,
        leadReceivedDate: data.leadReceivedDate || new Date(),
        ftdAmount: data.ftdAmount,
        paymentMethod: data.paymentMethod,
        paymentProvider: data.paymentProvider,
        priority: data.priority || LeadPriority.MEDIUM,
        assignedAgent: data.assignedAgent,
        age: data.age,
        salary: data.salary,
        jobIndustry: data.jobIndustry,
        workTitle: data.workTitle,
        convertedAt: data.convertedAt,
        affiliateId: data.affiliateId,
        funnelName: data.funnelName,
        subParameters: data.subParameters,
      },
    });
  }

  async updateLead(
    id: string,
    data: {
      personName?: string;
      email?: string;
      phoneNumber?: string;
      country?: string;
      source?: string;
      leadStatus?: LeadStatus;
      onlineStatus?: LeadOnlineStatus;
      leadReceivedDate?: Date;
      ftdAmount?: number;
      paymentMethod?: PaymentMethod;
      paymentProvider?: PaymentProvider;
      priority?: LeadPriority;
      assignedAgent?: string;
      callAttempts?: number;
      age?: number;
      salary?: string;
      jobIndustry?: string;
      workTitle?: string;
      convertedAt?: Date;
      affiliateId?: string;
      funnelName?: string;
      subParameters?: string;
    },
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Track field changes for activity log
    const changes: string[] = [];
    if (data.personName && data.personName !== lead.personName) {
      changes.push(`Name: ${lead.personName} → ${data.personName}`);
    }
    if (data.email && data.email !== lead.email) {
      changes.push(`Email: ${lead.email} → ${data.email}`);
    }
    if (data.leadStatus && data.leadStatus !== lead.leadStatus) {
      changes.push(`Status: ${lead.leadStatus} → ${data.leadStatus}`);
    }
    if (data.priority && data.priority !== lead.priority) {
      changes.push(`Priority: ${lead.priority} → ${data.priority}`);
    }

    // Automatically set convertedAt if status changes to CONVERTED and not already set
    if (
      data.leadStatus === LeadStatus.CONVERTED &&
      lead.leadStatus !== LeadStatus.CONVERTED
    ) {
      if (!data.convertedAt) {
        data.convertedAt = new Date();
      }
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data,
    });

    // Log field updates as activity
    if (changes.length > 0) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: id,
          activityType: LeadActivityType.FIELD_UPDATE,
          notes: changes.join(', '),
        },
      });
    }

    return updatedLead;
  }

  async deleteLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.prisma.lead.delete({ where: { id } });
  }

  async logActivity(
    leadId: string,
    activityType: LeadActivityType,
    notes?: string,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // If it's a call, increment call attempts
    if (activityType === LeadActivityType.CALL) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { callAttempts: { increment: 1 } },
      });
    }

    return this.prisma.leadActivity.create({
      data: {
        leadId,
        activityType,
        notes,
      },
    });
  }

  async importLeadsFromCSV(csvData: string) {
    const lines = csvData.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV file must have at least a header row and one data row',
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const leads: any[] = [];

    // Map CSV headers to our field names
    const fieldMap: { [key: string]: string } = {
      name: 'personName',
      person_name: 'personName',
      email: 'email',
      phone: 'phoneNumber',
      phone_number: 'phoneNumber',
      country: 'country',
      source: 'source',
      status: 'leadStatus',
      lead_status: 'leadStatus',
      online_status: 'onlineStatus',
      status_online: 'onlineStatus',
      lead_received_date: 'leadReceivedDate',
      date: 'leadReceivedDate',
      ftd_amount: 'ftdAmount',
      ftd: 'ftdAmount',
      payment_method: 'paymentMethod',
      payment_provider: 'paymentProvider',
      priority: 'priority',
      assigned_agent: 'assignedAgent',
      agent: 'assignedAgent',
      call_attempts: 'callAttempts',
      age: 'age',
      salary: 'salary',
      job_industry: 'jobIndustry',
      work_title: 'workTitle',
      converted_at: 'convertedAt',
      converted_date: 'convertedAt',
      affiliate_id: 'affiliateId',
      funnel_name: 'funnelName',
      sub_parameters: 'subParameters',
    };
    console.log(fieldMap);
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const leadData: any = {};

      headers.forEach((header, index) => {
        const fieldName = fieldMap[header] || header;
        const value = values[index]?.trim();

        if (value) {
          // Handle enum fields
          if (fieldName === 'leadStatus') {
            leadData.leadStatus = this.mapLeadStatus(value);
          } else if (fieldName === 'onlineStatus') {
            leadData.onlineStatus =
              value.toUpperCase() === 'ONLINE'
                ? LeadOnlineStatus.ONLINE
                : LeadOnlineStatus.OFFLINE;
          } else if (fieldName === 'paymentMethod') {
            leadData.paymentMethod = this.mapPaymentMethod(value);
          } else if (fieldName === 'paymentProvider') {
            leadData.paymentProvider = this.mapPaymentProvider(value);
          } else if (fieldName === 'priority') {
            leadData.priority = this.mapPriority(value);
          } else if (fieldName === 'ftdAmount') {
            leadData.ftdAmount = parseFloat(value) || null;
          } else if (fieldName === 'callAttempts') {
            leadData.callAttempts = parseInt(value) || 0;
          } else if (fieldName === 'age') {
            leadData.age = parseInt(value) || null;
          } else if (
            fieldName === 'leadReceivedDate' ||
            fieldName === 'convertedAt'
          ) {
            leadData[fieldName] = value ? new Date(value) : null;
          } else {
            leadData[fieldName] = value;
          }
        }
      });

      // Validate required fields
      if (!leadData.personName || !leadData.email) {
        continue; // Skip invalid rows
      }

      leads.push(leadData);
    }

    // Bulk create leads
    const createdLeads: any[] = [];
    for (const leadData of leads) {
      try {
        const lead = await this.createLead(leadData);
        createdLeads.push(lead as any);
      } catch (error) {
        console.error(
          `Error creating lead ${leadData.email as string}:`,
          error,
        );
      }
    }

    return {
      total: leads.length,
      created: createdLeads.length,
      leads: createdLeads,
    };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private mapLeadStatus(value: string): LeadStatus {
    const upper = value.toUpperCase().replace(/[_\s]/g, '_');
    const statusMap: { [key: string]: LeadStatus } = {
      NEW: LeadStatus.NEW,
      CONTACTED: LeadStatus.CONTACTED,
      QUALIFIED: LeadStatus.QUALIFIED,
      CALLBACK: LeadStatus.CALLBACK,
      FOLLOW_UP: LeadStatus.FOLLOW_UP,
      FOLLOWUP: LeadStatus.FOLLOW_UP,
      CONVERTED: LeadStatus.CONVERTED,
      LOST: LeadStatus.LOST,
    };
    return statusMap[upper] || LeadStatus.NEW;
  }

  private mapPaymentMethod(value: string): PaymentMethod | undefined {
    const upper = value.toUpperCase().replace(/[_\s]/g, '_');
    const methodMap: { [key: string]: PaymentMethod } = {
      CARD: PaymentMethod.CARD,
      BANK_TRANSFER: PaymentMethod.BANK_TRANSFER,
      BANK: PaymentMethod.BANK_TRANSFER,
      CRYPTO: PaymentMethod.CRYPTO,
      CRYPTOCURRENCY: PaymentMethod.CRYPTO,
    };
    return methodMap[upper];
  }

  private mapPaymentProvider(value: string): PaymentProvider | undefined {
    const upper = value.toUpperCase().replace(/[_\s]/g, '_');
    const providerMap: { [key: string]: PaymentProvider } = {
      STRIPE: PaymentProvider.STRIPE,
      PAYPAL: PaymentProvider.PAYPAL,
      SKRILL: PaymentProvider.SKRILL,
      NETELLER: PaymentProvider.NETELLER,
      BINANCE_PAY: PaymentProvider.BINANCE_PAY,
      BINANCE: PaymentProvider.BINANCE_PAY,
      COINBASE: PaymentProvider.COINBASE,
      WIRE_TRANSFER: PaymentProvider.WIRE_TRANSFER,
      WIRE: PaymentProvider.WIRE_TRANSFER,
      OTHER: PaymentProvider.OTHER,
    };
    return providerMap[upper];
  }

  private mapPriority(value: string): LeadPriority {
    const upper = value.toUpperCase();
    const priorityMap: { [key: string]: LeadPriority } = {
      LOW: LeadPriority.LOW,
      MEDIUM: LeadPriority.MEDIUM,
      HIGH: LeadPriority.HIGH,
      URGENT: LeadPriority.URGENT,
    };
    return priorityMap[upper] || LeadPriority.MEDIUM;
  }

  async getLeadStats() {
    const [
      all,
      newLeads,
      contacted,
      qualified,
      callback,
      followUp,
      converted,
      lost,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.NEW } }),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.CONTACTED } }),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.QUALIFIED } }),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.CALLBACK } }),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.FOLLOW_UP } }),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.CONVERTED } }),
      this.prisma.lead.count({ where: { leadStatus: LeadStatus.LOST } }),
    ]);

    return {
      all,
      new: newLeads,
      contacted,
      qualified,
      callback,
      followup: followUp,
      converted,
      lost,
    };
  }

  async getFtdReport(filters?: {
    search?: string;
    agent?: string;
    fromDate?: string;
    toDate?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      leadStatus: LeadStatus.CONVERTED,
    };

    if (filters?.search) {
      where.OR = [
        { personName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { country: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.agent && filters.agent !== 'all') {
      where.assignedAgent = filters.agent;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.convertedAt = {};
      if (filters?.fromDate) {
        const d = new Date(filters.fromDate);
        if (
          typeof filters.fromDate === 'string' &&
          filters.fromDate.length <= 10
        ) {
          d.setHours(0, 0, 0, 0);
        }
        where.convertedAt.gte = d;
      }
      if (filters?.toDate) {
        const d = new Date(filters.toDate);
        if (typeof filters.toDate === 'string' && filters.toDate.length <= 10) {
          d.setHours(23, 59, 59, 999);
        }
        where.convertedAt.lte = d;
      }
    }

    return this.prisma.lead.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take,
      orderBy: { convertedAt: 'desc' },
    });
  }

  async getFtdStats(filters?: {
    agent?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {
      leadStatus: LeadStatus.CONVERTED,
    };

    if (filters?.agent && filters.agent !== 'all') {
      where.assignedAgent = filters.agent;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.convertedAt = {};
      if (filters?.fromDate) {
        const d = new Date(filters.fromDate);
        if (
          typeof filters.fromDate === 'string' &&
          filters.fromDate.length <= 10
        ) {
          d.setHours(0, 0, 0, 0);
        }
        where.convertedAt.gte = d;
      }
      if (filters?.toDate) {
        const d = new Date(filters.toDate);
        if (typeof filters.toDate === 'string' && filters.toDate.length <= 10) {
          d.setHours(23, 59, 59, 999);
        }
        where.convertedAt.lte = d;
      }
    }

    const ftdLeads = await this.prisma.lead.findMany({ where });

    const totalFtd = ftdLeads.length;
    const totalDeposits = ftdLeads.reduce(
      (sum, lead) => sum + (lead.ftdAmount || 0),
      0,
    );
    const avgFtdAmount = totalFtd > 0 ? totalDeposits / totalFtd : 0;

    const activeAgents = new Set(
      ftdLeads
        .map((l) => l.assignedAgent)
        .filter((a) => a !== null && a !== undefined && a !== ''),
    ).size;

    return {
      totalFtd,
      totalDeposits,
      avgFtdAmount,
      activeAgents,
    };
  }

  async getAllMeetings(filters?: {
    search?: string;
    type?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { clientName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.type && filters.type !== 'all') {
      where.type = filters.type;
    }

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.startTime = {};
      if (filters?.fromDate) {
        const d = new Date(filters.fromDate);
        if (
          typeof filters.fromDate === 'string' &&
          filters.fromDate.length <= 10
        ) {
          d.setHours(0, 0, 0, 0);
        }
        where.startTime.gte = d;
      }
      if (filters?.toDate) {
        const d = new Date(filters.toDate);
        if (typeof filters.toDate === 'string' && filters.toDate.length <= 10) {
          d.setHours(23, 59, 59, 999);
        }
        where.startTime.lte = d;
      }
    }

    return this.prisma.cRMMeeting.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }

  async getMeetingStats(filters?: any) {
    const allMeetings = await this.prisma.cRMMeeting.findMany();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayMeetings = allMeetings.filter((m) => {
      const d = new Date(m.startTime);
      return d >= today && d < tomorrow;
    });

    return {
      totalMeetings: allMeetings.length,
      today: todayMeetings.length,
      calls: allMeetings.filter((m) => m.type?.toLowerCase() === 'call').length,
      meetings: allMeetings.filter((m) => m.type?.toLowerCase() === 'meeting')
        .length,
    };
  }

  // ─── API Key Management ───

  async generateApiKey(name: string) {
    if (!name || !name.trim()) {
      throw new BadRequestException('API key name is required');
    }

    const rawKey = `pc_${randomBytes(32).toString('hex')}`;
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashedKey,
      },
    });

    // Return the plaintext key ONLY on creation
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      createdAt: apiKey.createdAt,
      message: 'Store this key securely. It will not be shown again.',
    };
  }

  async listApiKeys() {
    return this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeApiKey(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'API key revoked successfully' };
  }

  async createMeeting(data: any) {
    return this.prisma.cRMMeeting.create({
      data: {
        title: data.title,
        clientName: data.clientName,
        startTime: new Date(data.startTime),
        duration: parseInt(data.duration) || 30,
        type: data.type || 'Call',
        status: data.status || 'SCHEDULED',
        description: data.description || '',
      },
    });
  }
}
