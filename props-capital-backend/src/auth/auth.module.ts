import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';

import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

import { JwtStrategy } from './jwt.strategy';

@Module({

  imports: [

    UsersModule,
    EmailModule,

    PassportModule,

    JwtModule.registerAsync({

      imports: [ConfigModule],

      useFactory: (configService: ConfigService) => {

        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {

          throw new Error('JWT_SECRET environment variable is not set');

        }

        return {

          secret,

          signOptions: {

            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d',

          } as any,

        };

      },

      inject: [ConfigService],

    }),

  ],

  providers: [AuthService, JwtStrategy],

  controllers: [AuthController],

})

export class AuthModule {}
