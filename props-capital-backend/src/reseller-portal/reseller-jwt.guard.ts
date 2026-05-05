import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ResellerJwtGuard extends AuthGuard('reseller-jwt') {}
