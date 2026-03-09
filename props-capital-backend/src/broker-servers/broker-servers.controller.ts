import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';
import { BrokerServersService } from './broker-servers.service';
import { CreateBrokerServerDto } from './dto/create-broker-server.dto';

@Controller('admin/broker-servers')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class BrokerServersController {
  constructor(private readonly brokerServersService: BrokerServersService) {}

  // Get all broker servers
  @Get()
  getAll() {
    return this.brokerServersService.getAll();
  }

  // Get one broker server
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.brokerServersService.getOne(id);
  }

  // Create a broker server
  @Post()
  create(@Body() data: CreateBrokerServerDto) {
    return this.brokerServersService.create(data);
  }

  // Update a broker server
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<CreateBrokerServerDto>) {
    return this.brokerServersService.update(id, data);
  }

  // Delete a broker server
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.brokerServersService.delete(id);
  }

  // Test connection to a broker server
  @Post(':id/test-connection')
  testConnection(@Param('id') id: string) {
    return this.brokerServersService.testConnection(id);
  }

  // Update connection status
  @Patch(':id/connection-status')
  updateConnectionStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.brokerServersService.updateConnectionStatus(id, data.status);
  }
}
