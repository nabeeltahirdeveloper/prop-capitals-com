import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Brand-portal JWT strategy.
 * Issues tokens with `kind: 'brand'` so they can be distinguished from
 * regular trader tokens and reseller tokens. Routes guarded by BrandJwtGuard
 * accept only kind === 'brand'.
 */
@Injectable()
export class BrandJwtStrategy extends PassportStrategy(Strategy, 'brand-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload?.kind !== 'brand') return null;
    return {
      brandId: payload.sub,
      username: payload.username,
      kind: payload.kind,
      accountType: payload.accountType,
    };
  }
}
