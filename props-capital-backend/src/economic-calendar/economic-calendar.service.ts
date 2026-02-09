import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

type Mql5Event = {
  Id: number;
  EventType: number;
  Importance: 'none' | 'low' | 'medium' | 'high';
  CurrencyCode: string;
  EventName: string;
  ForecastValue: string;
  PreviousValue: string;
  ActualValue: string;
  ReleaseDate: number; // ms epoch
  Url: string | null;
  Country: number;
  CountryName: string | null;
};

export type CalendarEvent = {
  id: number;
  name: string;
  currency: string;
  importance: Mql5Event['Importance'];
  eventType: number;
  releaseAt: number;
  releaseISO: string;
  actual: string;
  forecast: string;
  previous: string;
  url: string | null;
  countryId: number;
  countryName: string | null;
};

@Injectable()
export class EconomicCalendarService {
  private readonly endpoint = 'https://www.mql5.com/en/economic-calendar/content';

  constructor(
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private buildBody(fromISO: string, toISO: string) {
    const p = new URLSearchParams();
    p.set('date_mode', '4');
    p.set('from', fromISO); // "YYYY-MM-DDTHH:mm:ss"
    p.set('to', toISO);
    p.set('importance', '15');
    p.set('currencies', '262143');
    return p.toString();
  }

  private normalize(items: Mql5Event[]): CalendarEvent[] {
    return items.map((e) => ({
      id: e.Id,
      name: e.EventName,
      currency: e.CurrencyCode,
      importance: e.Importance,
      eventType: e.EventType,
      releaseAt: e.ReleaseDate,
      releaseISO: new Date(e.ReleaseDate).toISOString(),
      actual: e.ActualValue ?? '',
      forecast: e.ForecastValue ?? '',
      previous: e.PreviousValue ?? '',
      url: e.Url ? `https://www.mql5.com${e.Url}` : null,
      countryId: e.Country,
      countryName: e.CountryName,
    }));
  }

  async fetchMonthUTC(month: string) {
    const { fromISO, toISO } = monthToRangeUTC(month);
    const cacheKey = `mql5:cal:${fromISO}:${toISO}`;

    const cached = await this.cache.get<{ events: CalendarEvent[] }>(cacheKey);
    if (cached) return cached;

    const body = this.buildBody(fromISO, toISO);

    const res = await firstValueFrom(
      this.http.post<Mql5Event[]>(this.endpoint, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.mql5.com/en/economic-calendar',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 15000,
      }),
    );

    const raw = Array.isArray(res.data) ? res.data : [];
    const payload = { month, events: this.normalize(raw) };

    await this.cache.set(cacheKey, payload, 60 * 10);
    return payload;
  }
}

function monthToRangeUTC(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Invalid month format. Use YYYY-MM');
  }
  const [yStr, mStr] = month.split('-');
  const y = Number(yStr);
  const m = Number(mStr); // 1-12

  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  // MQL5 accepts without trailing Z, so match what you saw in network:
  const toParam = (d: Date) => d.toISOString().slice(0, 19);

  return { fromISO: toParam(from), toISO: toParam(to) };
}