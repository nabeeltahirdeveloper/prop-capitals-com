import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class BrandJwtGuard extends AuthGuard('brand-jwt') {}
