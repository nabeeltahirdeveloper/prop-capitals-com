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
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('crm/meetings')
@UseGuards(JwtAuthGuard)
export class CrmMeetingsController {
    constructor(private readonly crmService: CrmService) { }

    @Get()
    async getAllMeetings(
        @Query('search') search?: string,
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.crmService.getAllMeetings({
            search,
            type,
            status,
            fromDate,
            toDate,
        });
    }

    @Get('stats')
    async getStats() {
        return this.crmService.getMeetingStats();
    }

    @Post()
    async createMeeting(@Body() body: any) {
        return this.crmService.createMeeting(body);
    }
}
