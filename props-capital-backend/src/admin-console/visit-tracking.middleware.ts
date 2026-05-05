import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AdminConsoleService } from './admin-console.service';

/**
 * VisitTrackingMiddleware
 *
 * Records every public-facing GET request as a Visit row. Intended to be
 * mounted on root paths only (Home, Challenges, Pricing, etc.) — NOT on
 * admin/api/auth endpoints.
 *
 * Rules:
 *  - GET only (skip POST/PATCH/etc)
 *  - Skip /admin*, /admin-console*, /auth*, /api*, /health, /favicon.ico
 *  - Tracking is async fire-and-forget — never blocks the response
 *  - IP comes from x-forwarded-for (first hop) when present, else req.ip
 */
@Injectable()
export class VisitTrackingMiddleware implements NestMiddleware {
  constructor(private readonly svc: AdminConsoleService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    if (req.method !== 'GET') return next();

    const path = req.path || req.originalUrl || '';
    if (
      path.startsWith('/admin') ||
      path.startsWith('/auth') ||
      path.startsWith('/api') ||
      path.startsWith('/health') ||
      path.includes('favicon') ||
      path.startsWith('/socket.io') ||
      path.startsWith('/_next') ||
      path.startsWith('/assets')
    ) {
      return next();
    }

    const xff = (req.headers['x-forwarded-for'] || '') as string;
    const ip = xff.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || '';
    if (!ip) return next();

    const userAgent = (req.headers['user-agent'] || '') as string;

    // Fire and forget — do not await
    void this.svc.trackVisit({ ip, userAgent });

    next();
  }
}
