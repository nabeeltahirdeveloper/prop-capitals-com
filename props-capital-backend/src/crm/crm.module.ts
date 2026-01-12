import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmMeetingsController } from './crm-meetings.controller';
import { CrmService } from './crm.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CrmController, CrmMeetingsController],
    providers: [CrmService],
    exports: [CrmService],
})
export class CrmModule { }
