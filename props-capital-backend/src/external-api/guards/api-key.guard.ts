import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const hashedKey = createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });

    if (!keyRecord || !keyRecord.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Update lastUsedAt (fire and forget)
    this.prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    // Attach key info to request for logging
    request.apiKey = { id: keyRecord.id, name: keyRecord.name };

    return true;
  }
}
