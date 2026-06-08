import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Fetches and caches the Xoala merchant AuthToken (JWT) used as the
// `AuthToken` HTTP header on every S2S transaction call.
//
// Xoala tokens are valid for 1 hour per their docs. We cache in-memory
// for 55 minutes to avoid edge-of-window failures, and coalesce concurrent
// requests so we never fetch in parallel.
@Injectable()
export class XoalaAuthService {
  private readonly logger = new Logger(XoalaAuthService.name);

  private cachedToken: string | null = null;
  private cachedTokenExpiresAt = 0;
  private inflight: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {}

  async getAuthToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedTokenExpiresAt) {
      return this.cachedToken;
    }
    if (this.inflight) {
      return this.inflight;
    }
    this.inflight = this.fetchFreshToken().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  // Force a refresh on next call (e.g. after a 401 from Xoala).
  invalidate() {
    this.cachedToken = null;
    this.cachedTokenExpiresAt = 0;
  }

  private async fetchFreshToken(): Promise<string> {
    const baseUrl = this.config.get<string>('XOALA_S2S_BASE_URL');
    const partnerId = this.config.get<string>('XOALA_PARTNER_ID');
    const username = this.config.get<string>('XOALA_MERCHANT_USERNAME');
    const secureKey = this.config.get<string>('XOALA_SECURE_KEY');

    if (!baseUrl || !partnerId || !username || !secureKey) {
      this.logger.error('Missing Xoala S2S auth env vars', {
        baseUrl: !!baseUrl,
        partnerId: !!partnerId,
        username: !!username,
        secureKey: !!secureKey,
      });
      throw new InternalServerErrorException(
        'Xoala S2S auth environment variables not configured',
      );
    }

    const url = `${baseUrl}/transactionServices/REST/v1/authToken`;
    const params = new URLSearchParams({
      'authentication.partnerId': partnerId,
      'merchant.username': username,
      'authentication.sKey': secureKey,
    });

    this.logger.log(`[Xoala Auth] Fetching fresh AuthToken from ${url}`);

    try {
      const res = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15_000,
      });

      const body = res.data || {};
      // Xoala's actual response field is `AuthToken` (PascalCase).
      // Keep the lowercase variants as fallbacks in case the casing
      // differs across environments or future API versions.
      const token: unknown =
        body.AuthToken ||
        body.authToken ||
        body.token ||
        body?.result?.AuthToken ||
        body?.result?.authToken ||
        body?.data?.AuthToken ||
        body?.data?.authToken ||
        body?.data?.token;

      if (!token || typeof token !== 'string') {
        this.logger.error(
          `[Xoala Auth] No token field in response: ${String(JSON.stringify(body)).slice(0, 300)}`,
        );
        throw new InternalServerErrorException(
          'Xoala authToken response did not contain a token field',
        );
      }

      this.cachedToken = token;
      // Refresh 5 min before the 1-hour TTL.
      this.cachedTokenExpiresAt = Date.now() + 55 * 60 * 1000;
      this.logger.log(
        `[Xoala Auth] Token cached until ${new Date(this.cachedTokenExpiresAt).toISOString()}`,
      );
      return token;
    } catch (err: any) {
      this.invalidate();
      // Re-throw our own already-logged "no token field" error untouched.
      if (err instanceof InternalServerErrorException) throw err;

      const status = err?.response?.status;
      const respBody = err?.response?.data;
      const bodyStr =
        respBody !== undefined
          ? String(JSON.stringify(respBody)).slice(0, 300)
          : '(no response body)';
      this.logger.error(
        `[Xoala Auth] Failed to fetch AuthToken status=${status} body=${bodyStr} message=${err?.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to obtain Xoala AuthToken',
      );
    }
  }
}
