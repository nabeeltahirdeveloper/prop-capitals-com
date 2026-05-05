import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ResellerPortalController } from './reseller-portal.controller';
import { ResellerPortalService } from './reseller-portal.service';
import { ResellerJwtStrategy } from './reseller-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: cfg.get<string>('RESELLER_JWT_EXPIRES_IN') || '7d',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ResellerPortalService, ResellerJwtStrategy],
  controllers: [ResellerPortalController],
  exports: [ResellerPortalService],
})
export class ResellerPortalModule {}
