import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TicketStatus } from '@prisma/client';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public endpoint - no auth required
  @Post()
  async create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.create(dto);
  }

  // Admin endpoints - auth required
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.contactService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus },
  ) {
    return this.contactService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.contactService.delete(id);
  }
}
