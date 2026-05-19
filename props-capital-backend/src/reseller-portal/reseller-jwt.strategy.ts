import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Reseller-portal JWT strategy. Tokens carry kind: 'reseller' so they're
 * distinguishable from trader and brand tokens.
 */
@Injectable()
export class ResellerJwtStrategy extends PassportStrategy(Strategy, 'reseller-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload?.kind !== 'reseller') return null;
    return {
      resellerId: payload.sub,
      username: payload.username,
      kind: payload.kind,
    };
  }
}
