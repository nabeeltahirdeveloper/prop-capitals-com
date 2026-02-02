import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { BrokerServersService } from './broker-servers.service';

@Controller('admin/broker-servers')
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
  create(@Body() data: any) {
    return this.brokerServersService.create(data);
  }

  // Update a broker server
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
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
