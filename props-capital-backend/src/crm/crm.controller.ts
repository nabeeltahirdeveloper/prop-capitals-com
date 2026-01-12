import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
    LeadStatus,
    // LeadOnlineStatus,
    // PaymentMethod,
    // PaymentProvider,
    // LeadPriority,
    LeadActivityType,
} from '@prisma/client';


@Controller('crm/leads')
@UseGuards(JwtAuthGuard)
export class CrmController {
    constructor(private readonly crmService: CrmService) { }

    @Get()
    async getAllLeads(
        @Query('status') status?: LeadStatus,
        @Query('search') search?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (search) filters.search = search;
        if (fromDate) filters.fromDate = new Date(fromDate);
        if (toDate) filters.toDate = new Date(toDate);
        if (skip) filters.skip = parseInt(skip);
        if (take) filters.take = parseInt(take);

        return this.crmService.getAllLeads(filters);
    }

    @Get('stats')
    async getStats() {
        return this.crmService.getLeadStats();
    }

    @Get('ftd-report')
    async getFtdReport(
        @Query('search') search?: string,
        @Query('agent') agent?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        const filters: any = {};
        if (search) filters.search = search;
        if (agent) filters.agent = agent;
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
        if (skip) filters.skip = parseInt(skip);
        if (take) filters.take = parseInt(take);

        return this.crmService.getFtdReport(filters);
    }

    @Get('ftd-stats')
    async getFtdStats(
        @Query('agent') agent?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        const filters: any = {};
        if (agent) filters.agent = agent;
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;

        return this.crmService.getFtdStats(filters);
    }

    @Get(':id')
    async getLeadById(@Param('id') id: string) {
        return this.crmService.getLeadById(id);
    }

    @Patch(':id')
    async updateLead(@Param('id') id: string, @Body() body: any) {
        return this.crmService.updateLead(id, body);
    }

    @Delete(':id')
    async deleteLead(@Param('id') id: string) {
        return this.crmService.deleteLead(id);
    }

    @Post()
    async createLead(@Body() body: any) {
        return this.crmService.createLead(body);
    }

    @Post(':id/activities')
    async logActivity(
        @Param('id') leadId: string,
        @Body() body: { activityType: LeadActivityType; notes?: string },
    ) {
        return this.crmService.logActivity(leadId, body.activityType, body.notes);
    }

    @Post('import/csv')
    @UseInterceptors(FileInterceptor('file'))
    async importCSV(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
            throw new BadRequestException('File must be a CSV');
        }

        const csvData = file.buffer.toString('utf-8');
        return this.crmService.importLeadsFromCSV(csvData);
    }
}
