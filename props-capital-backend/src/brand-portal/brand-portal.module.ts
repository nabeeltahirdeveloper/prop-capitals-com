import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminConsoleModule } from '../admin-console/admin-console.module';
import { BrandPortalController } from './brand-portal.controller';
import { BrandPortalService } from './brand-portal.service';
import { BrandJwtStrategy } from './brand-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    // Brand portal self-heals link provisioning by calling
    // AdminConsoleService.autoCreateBrandLinks when a brand has zero links.
    AdminConsoleModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: cfg.get<string>('BRAND_JWT_EXPIRES_IN') || '7d',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BrandPortalService, BrandJwtStrategy],
  controllers: [BrandPortalController],
  exports: [BrandPortalService],
})
export class BrandPortalModule {}
