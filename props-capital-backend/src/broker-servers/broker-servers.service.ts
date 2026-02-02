import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengePlatform } from '@prisma/client';

@Injectable()
export class BrokerServersService {
  constructor(private prisma: PrismaService) {}

  // Get all broker servers
  async getAll() {
    const servers = await this.prisma.brokerServer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    // Map to frontend format (snake_case)
    return servers.map((server) => ({
      id: server.id,
      name: server.name,
      platform: server.platform,
      server_address: server.host,
      server_port: server.port,
      description: server.description,
      is_demo: true, // Default value - field not in DB yet
      timezone: 'UTC', // Default value - field not in DB yet
      connection_status: 'not_connected', // Default value - field not in DB yet
      last_sync: null, // Default value - field not in DB yet
      accounts_count: server._count.accounts,
      created_at: server.createdAt,
      updated_at: server.updatedAt,
    }));
  }

  // Get one broker server
  async getOne(id: string) {
    const server = await this.prisma.brokerServer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Broker server not found');
    }

    return {
      id: server.id,
      name: server.name,
      platform: server.platform,
      server_address: server.host,
      server_port: server.port,
      description: server.description,
      is_demo: true,
      timezone: 'UTC',
      connection_status: 'not_connected',
      last_sync: null,
      accounts_count: server._count.accounts,
      created_at: server.createdAt,
      updated_at: server.updatedAt,
    };
  }

  // Create a broker server
  async create(data: any) {
    // Validate required fields
    if (!data.name) {
      throw new BadRequestException('Server name is required');
    }
    if (!data.server_address && !data.host) {
      throw new BadRequestException('Server address is required');
    }

    // Validate and normalize platform
    const platformValue = data.platform?.toUpperCase();
    if (!['MT4', 'MT5', 'CTRADER', 'DXTRADE'].includes(platformValue)) {
      throw new BadRequestException('Invalid platform. Must be MT4, MT5, CTRADER, or DXTRADE');
    }

    const server = await this.prisma.brokerServer.create({
      data: {
        name: data.name,
        platform: platformValue as ChallengePlatform,
        host: data.server_address || data.host,
        port: parseInt(String(data.server_port || data.port || 443)),
        description: data.description || null,
      },
    });

    return {
      id: server.id,
      name: server.name,
      platform: server.platform,
      server_address: server.host,
      server_port: server.port,
      description: server.description,
      is_demo: true,
      timezone: 'UTC',
      connection_status: 'not_connected',
      last_sync: null,
      created_at: server.createdAt,
      updated_at: server.updatedAt,
    };
  }

  // Update a broker server
  async update(id: string, data: any) {
    await this.getOne(id); // Ensures exists

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.server_address !== undefined || data.host !== undefined) {
      updateData.host = data.server_address || data.host;
    }
    if (data.server_port !== undefined || data.port !== undefined) {
      updateData.port = parseInt(String(data.server_port || data.port));
    }
    if (data.platform !== undefined) {
      const platformValue = data.platform.toUpperCase();
      if (!['MT4', 'MT5', 'CTRADER', 'DXTRADE'].includes(platformValue)) {
        throw new BadRequestException('Invalid platform');
      }
      updateData.platform = platformValue as ChallengePlatform;
    }

    const server = await this.prisma.brokerServer.update({
      where: { id },
      data: updateData,
    });

    return {
      id: server.id,
      name: server.name,
      platform: server.platform,
      server_address: server.host,
      server_port: server.port,
      description: server.description,
      is_demo: true,
      timezone: 'UTC',
      connection_status: 'not_connected',
      last_sync: null,
      created_at: server.createdAt,
      updated_at: server.updatedAt,
    };
  }

  // Delete a broker server
  async delete(id: string) {
    const server = await this.prisma.brokerServer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Broker server not found');
    }

    if (server._count.accounts > 0) {
      throw new BadRequestException(
        `Cannot delete broker server. It has ${server._count.accounts} linked trading account(s).`
      );
    }

    await this.prisma.brokerServer.delete({ where: { id } });

    return { message: 'Broker server deleted successfully' };
  }

  // Test connection to broker server (placeholder)
  async testConnection(id: string) {
    const server = await this.prisma.brokerServer.findUnique({ where: { id } });

    if (!server) {
      throw new NotFoundException('Broker server not found');
    }

    // TODO: Implement actual connection test based on platform
    return {
      success: false,
      message: 'Connection test not yet implemented for this platform',
      platform: server.platform,
      connection_status: 'not_connected',
    };
  }

  // Update connection status (placeholder - no DB field yet)
  async updateConnectionStatus(id: string, status: string) {
    const validStatuses = ['connected', 'error', 'not_connected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid connection status');
    }

    const server = await this.prisma.brokerServer.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException('Broker server not found');
    }

    // Return simulated response (field not in DB yet)
    return {
      id: server.id,
      connection_status: status,
      last_sync: status === 'connected' ? new Date() : null,
    };
  }
}
