import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExternalApiService } from './external-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CreateLeadDto, CreateLeadBulkDto } from './dto/create-lead.dto';

@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  async createLead(@Body() dto: CreateLeadDto) {
    const lead = await this.externalApiService.createLead(dto);
    return {
      success: true,
      message: 'Lead created successfully',
      lead,
    };
  }

  @Post('leads/bulk')
  @HttpCode(HttpStatus.CREATED)
  async createLeadsBulk(@Body() dto: CreateLeadBulkDto) {
    const result = await this.externalApiService.createLeadsBulk(dto.leads);
    return {
      success: true,
      message: `${result.created} of ${result.total} leads created`,
      ...result,
    };
  }

  @Get('leads/:id')
  async getLeadById(@Param('id') id: string) {
    const lead = await this.externalApiService.getLeadById(id);
    return {
      success: true,
      lead,
    };
  }
}
