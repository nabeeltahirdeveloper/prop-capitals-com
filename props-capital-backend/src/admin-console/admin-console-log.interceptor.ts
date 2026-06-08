import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AdminConsoleService } from './admin-console.service';

/**
 * AdminConsoleLogInterceptor
 *
 * Captures every request that hits an /admin-console/* endpoint into the
 * AdminLog table so the System Logs section has real data to display.
 *
 * - Skips the read-only /logs and /logs/* endpoints themselves to prevent
 *   recursive log explosion (every page-refresh of the logs viewer would
 *   otherwise generate a new log entry).
 * - Never lets a logging failure break the actual request — wraps in try/catch
 *   inside the service.
 */
@Injectable()
export class AdminConsoleLogInterceptor implements NestInterceptor {
  constructor(private readonly svc: AdminConsoleService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = ctx.switchToHttp().getRequest();
    const route: string =
      req?.route?.path ?? req?.originalUrl ?? req?.url ?? '';

    // Skip log-fetching endpoints to avoid recursive log noise
    if (
      route.includes('/admin-console/logs') ||
      route.includes('/admin-console/bot-logs')
    ) {
      return next.handle();
    }

    const httpMethod: string = req?.method ?? 'GET';
    const userEmail: string | undefined = req?.user?.email;
    const userId: string | undefined = req?.user?.userId ?? req?.user?.sub;
    const queryParams =
      req?.query && Object.keys(req.query).length ? req.query : null;
    const requestBody =
      httpMethod === 'GET' ? null : redactSensitive(req?.body);

    const category = deriveCategory(route);
    const action = `${httpMethod} ${route}`;

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        void this.svc.writeAdminLog({
          logLevel: elapsed > 5000 ? 'WARN' : 'INFO',
          category,
          action,
          message: `${httpMethod} ${route}`,
          userId,
          userEmail,
          httpMethod,
          route,
          queryParams,
          requestBody,
          responseStatus: ctx.switchToHttp().getResponse()?.statusCode ?? 200,
          responseTimeMs: elapsed,
        });
      }),
      catchError((err) => {
        const elapsed = Date.now() - start;
        void this.svc.writeAdminLog({
          logLevel: err?.status >= 500 ? 'CRITICAL' : 'ERROR',
          category,
          action,
          message: err?.message ?? 'Request failed',
          userId,
          userEmail,
          httpMethod,
          route,
          queryParams,
          requestBody,
          responseStatus: err?.status ?? 500,
          responseTimeMs: elapsed,
          details: { stack: err?.stack?.split('\n').slice(0, 5).join('\n') },
        });
        return throwError(() => err);
      }),
    );
  }
}

function deriveCategory(route: string): string {
  const m = route.match(/\/admin-console\/([a-z-]+)/);
  return m?.[1] ?? 'admin-console';
}

function redactSensitive(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const out: any = Array.isArray(body) ? [...body] : { ...body };
  for (const k of Object.keys(out)) {
    if (/password|secret|token|api[_-]?key/i.test(k)) {
      out[k] = '[REDACTED]';
    }
  }
  return out;
}
