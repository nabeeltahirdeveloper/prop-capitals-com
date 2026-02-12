import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

export type HistoryEntry = {
  date: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
};

export type ChartPoint = {
  date: string;
  value: number;
};

export type EventDetail = {
  title: string;
  country: string;
  currency: string;
  importance: string;
  description: string;
  nextRelease: string | null;
  source: string | null;
  sourceUrl: string | null;
  frequency: string | null;
  unit: string | null;
  history?: HistoryEntry[];
  chartSeries?: ChartPoint[];
};

@Injectable()
export class EconomicCalendarService {
  private readonly logger = new Logger(EconomicCalendarService.name);
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

  async fetchEventDetail(urlPath: string): Promise<EventDetail> {
    const cacheKey = `mql5:event:${urlPath}`;

    // Check cache first (1 hour TTL for event details)
    const cached = await this.cache.get<EventDetail>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${urlPath}`);
      return cached;
    }

    const url = `https://www.mql5.com${urlPath}`;

    const res = await firstValueFrom(
      this.http.get<string>(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: 'https://www.mql5.com/en/economic-calendar',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
        responseType: 'text',
        maxRedirects: 5,
      }),
    );

    const html = res.data;
    const finalUrl = res.request?.res?.responseUrl || url;

    // Diagnostics: log response info
    this.logger.log(
      `Fetched event detail: status=${res.status}, finalUrl=${finalUrl}, htmlLength=${html.length}`,
    );

    // Save raw HTML to temp file for debugging
    try {
      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, 'mql5_event.html');
      fs.writeFileSync(tmpFile, html, 'utf-8');
      this.logger.debug(`Saved raw HTML to ${tmpFile}`);
    } catch (err) {
      this.logger.warn(`Failed to save HTML to temp file: ${err}`);
    }

    const detail = this.parseEventDetailHtml(html, urlPath);

    // Cache for 1 hour (3600 seconds)
    await this.cache.set(cacheKey, detail, 60 * 60);
    return detail;
  }

  private parseEventDetailHtml(html: string, urlPath: string): EventDetail {
    const $ = cheerio.load(html);
    const htmlLower = html.toLowerCase();

    // Extract country from path: /en/economic-calendar/{country}/{indicator}
    const pathSegments = urlPath.split('/');
    const countrySlug = pathSegments[3] || '';
    const country = toTitleCase(countrySlug.replace(/-/g, ' '));

    // Extract title from page header
    const title =
      $('h1.event__title').text().trim() ||
      $('h1').first().text().trim() ||
      $('.event-name').text().trim() ||
      '';

    // Extract currency
    const currency =
      $('.event__currency').text().trim() ||
      $('[class*="currency"]').first().text().trim() ||
      '';

    // Extract importance and normalize to lowercase
    const importanceRaw =
      $('.event__importance').text().trim() ||
      $('[class*="importance"]').first().text().trim() ||
      '';
    const importance = importanceRaw.toLowerCase();

    // Extract description
    const description =
      $('.event__description').text().trim() ||
      $('.event-description').text().trim() ||
      $('[class*="description"]').first().text().trim() ||
      $('article p').first().text().trim() ||
      '';

    // Initialize optional fields
    let nextRelease: string | null = null;
    let source: string | null = null;
    let sourceUrl: string | null = null;
    let frequency: string | null = null;
    let unit: string | null = null;
    let history: HistoryEntry[] | undefined;
    let chartSeries: ChartPoint[] | undefined;

    // Check for keywords (case-insensitive)
    const hasKeywords = {
      nextRelease: /next\s*release/i.test(htmlLower),
      source: /\bsource\b/i.test(htmlLower),
      frequency: /\bfrequency\b/i.test(htmlLower),
      unit: /\bunit\b/i.test(htmlLower),
    };

    const hasAnyKeyword = Object.values(hasKeywords).some(Boolean);

    this.logger.debug(
      `Keyword detection: ${JSON.stringify(hasKeywords)}, hasAnyKeyword=${hasAnyKeyword}`,
    );

    if (hasAnyKeyword) {
      // Strategy 1: Label/value row scraping
      const labelValueMap = this.extractLabelValuePairs($);
      this.logger.debug(`Extracted label-value pairs: ${JSON.stringify(labelValueMap)}`);

      nextRelease = labelValueMap['next release'] || labelValueMap['nextrelease'] || null;
      source = labelValueMap['source'] || null;
      frequency = labelValueMap['frequency'] || null;
      unit = labelValueMap['unit'] || labelValueMap['units'] || null;

      // Try to extract source URL from source row
      if (hasKeywords.source) {
        const sourceLink = this.findLinkByLabel($, 'source');
        if (sourceLink.url) {
          sourceUrl = sourceLink.url;
          if (!source) source = sourceLink.text;
        }
      }
    }

    // Strategy 2: Try embedded JSON if keywords missing or fields still null
    const embeddedData = this.extractEmbeddedJson(html);
    if (embeddedData) {
      this.logger.debug(`Found embedded JSON data`);

      // Fill in missing fields from embedded JSON
      if (!nextRelease && embeddedData.nextRelease) {
        nextRelease = embeddedData.nextRelease;
      }
      if (!source && embeddedData.source) {
        source = embeddedData.source;
      }
      if (!sourceUrl && embeddedData.sourceUrl) {
        sourceUrl = embeddedData.sourceUrl;
      }
      if (!frequency && embeddedData.frequency) {
        frequency = embeddedData.frequency;
      }
      if (!unit && embeddedData.unit) {
        unit = embeddedData.unit;
      }
      if (embeddedData.history && embeddedData.history.length > 0) {
        history = embeddedData.history;
      }
      if (embeddedData.chartSeries && embeddedData.chartSeries.length > 0) {
        chartSeries = embeddedData.chartSeries;
      }
    }

    // Strategy 3: Try to extract history from HTML tables
    if (!history || history.length === 0) {
      history = this.extractHistoryFromTable($);
    }

    // Strategy 4: Fallback to class-based selectors for remaining nulls
    if (!nextRelease) {
      nextRelease =
        $('.event__next-release').text().trim() ||
        $('[class*="next-release"]').first().text().trim() ||
        null;
    }
    if (!source) {
      const sourceElement = $('.event__source a, [class*="source"] a').first();
      source = sourceElement.text().trim() || null;
      if (!sourceUrl) {
        sourceUrl = sourceElement.attr('href') || null;
      }
    }
    if (!frequency) {
      frequency =
        $('.event__frequency').text().trim() ||
        $('[class*="frequency"]').first().text().trim() ||
        null;
    }
    if (!unit) {
      unit =
        $('.event__unit').text().trim() ||
        $('[class*="unit"]').first().text().trim() ||
        null;
    }

    const result: EventDetail = {
      title,
      country,
      currency,
      importance,
      description,
      nextRelease,
      source,
      sourceUrl,
      frequency,
      unit,
    };

    // Add optional arrays only if they have data
    if (history && history.length > 0) {
      result.history = history;
    }
    if (chartSeries && chartSeries.length > 0) {
      result.chartSeries = chartSeries;
    }

    return result;
  }

  /**
   * Extract label/value pairs from table rows, definition lists, etc.
   */
  private extractLabelValuePairs(
    $: cheerio.CheerioAPI,
  ): Record<string, string> {
    const pairs: Record<string, string> = {};

    // Strategy 1: Look for table rows with label/value structure
    $('tr').each((_, row) => {
      const cells = $(row).find('td, th');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().toLowerCase().replace(/:/g, '');
        const value = $(cells[1]).text().trim();
        if (label && value) {
          pairs[label] = value;
        }
      }
    });

    // Strategy 2: Look for definition lists
    $('dl').each((_, dl) => {
      $(dl)
        .find('dt')
        .each((i, dt) => {
          const label = $(dt).text().trim().toLowerCase().replace(/:/g, '');
          const dd = $(dt).next('dd');
          const value = dd.text().trim();
          if (label && value) {
            pairs[label] = value;
          }
        });
    });

    // Strategy 3: Look for label/value divs
    $('[class*="label"], [class*="field-name"]').each((_, el) => {
      const label = $(el).text().trim().toLowerCase().replace(/:/g, '');
      const valueEl =
        $(el).next('[class*="value"]') ||
        $(el).next() ||
        $(el).parent().find('[class*="value"]');
      const value = valueEl.text().trim();
      if (label && value && value !== label) {
        pairs[label] = value;
      }
    });

    // Strategy 4: Look for spans/divs with specific patterns
    $('div, span, p').each((_, el) => {
      const text = $(el).text().trim();
      const match = text.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const label = match[1].toLowerCase().trim();
        const value = match[2].trim();
        if (label && value && !pairs[label]) {
          pairs[label] = value;
        }
      }
    });

    return pairs;
  }

  /**
   * Find a link element associated with a specific label
   */
  private findLinkByLabel(
    $: cheerio.CheerioAPI,
    label: string,
  ): { text: string | null; url: string | null } {
    const labelLower = label.toLowerCase();
    let result = { text: null as string | null, url: null as string | null };

    // Look for rows/cells containing the label
    $('tr, div, dl').each((_, container) => {
      const containerText = $(container).text().toLowerCase();
      if (containerText.includes(labelLower)) {
        const link = $(container).find('a').first();
        if (link.length) {
          result = {
            text: link.text().trim() || null,
            url: link.attr('href') || null,
          };
          return false; // break
        }
      }
    });

    return result;
  }

  /**
   * Extract data from embedded JSON (Next.js data, JSON-LD, window.* variables)
   */
  private extractEmbeddedJson(html: string): Partial<{
    nextRelease: string;
    source: string;
    sourceUrl: string;
    frequency: string;
    unit: string;
    history: HistoryEntry[];
    chartSeries: ChartPoint[];
  }> | null {
    const result: Partial<{
      nextRelease: string;
      source: string;
      sourceUrl: string;
      frequency: string;
      unit: string;
      history: HistoryEntry[];
      chartSeries: ChartPoint[];
    }> = {};

    // Try __NEXT_DATA__
    const nextDataMatch = html.match(
      /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
    );
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1]);
        this.extractFromNestedJson(data, result);
      } catch (e) {
        this.logger.debug(`Failed to parse __NEXT_DATA__: ${e}`);
      }
    }

    // Try application/ld+json
    const ldJsonMatches = html.matchAll(
      /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
    );
    for (const match of ldJsonMatches) {
      try {
        const data = JSON.parse(match[1]);
        this.extractFromNestedJson(data, result);
      } catch (e) {
        this.logger.debug(`Failed to parse ld+json: ${e}`);
      }
    }

    // Try window.__* variables
    const windowVarMatches = html.matchAll(
      /window\.(__[A-Z_]+)\s*=\s*(\{[\s\S]*?\});/gi,
    );
    for (const match of windowVarMatches) {
      try {
        const data = JSON.parse(match[2]);
        this.extractFromNestedJson(data, result);
      } catch (e) {
        this.logger.debug(`Failed to parse window.${match[1]}: ${e}`);
      }
    }

    // Try generic JSON objects in script tags
    const scriptMatches = html.matchAll(
      /<script[^>]*>\s*(?:var\s+\w+\s*=\s*)?(\{[\s\S]*?"(?:history|values|data|chart)"[\s\S]*?\})\s*;?\s*<\/script>/gi,
    );
    for (const match of scriptMatches) {
      try {
        const data = JSON.parse(match[1]);
        this.extractFromNestedJson(data, result);
      } catch (e) {
        // Ignore parse errors for generic matches
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Recursively search nested JSON for relevant fields
   */
  private extractFromNestedJson(
    obj: unknown,
    result: Partial<{
      nextRelease: string;
      source: string;
      sourceUrl: string;
      frequency: string;
      unit: string;
      history: HistoryEntry[];
      chartSeries: ChartPoint[];
    }>,
  ): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      // Check if this is a history array
      if (
        obj.length > 0 &&
        obj[0] &&
        typeof obj[0] === 'object' &&
        ('actual' in obj[0] || 'value' in obj[0] || 'date' in obj[0])
      ) {
        const isHistory = obj.every(
          (item) =>
            item &&
            typeof item === 'object' &&
            ('actual' in item || 'forecast' in item || 'previous' in item),
        );
        const isChart = obj.every(
          (item) =>
            item &&
            typeof item === 'object' &&
            'value' in item &&
            typeof (item as Record<string, unknown>).value === 'number',
        );

        if (isHistory && !result.history) {
          result.history = obj.map((item) => ({
            date: String((item as Record<string, unknown>).date || ''),
            actual: (item as Record<string, unknown>).actual != null 
              ? String((item as Record<string, unknown>).actual) 
              : null,
            forecast: (item as Record<string, unknown>).forecast != null 
              ? String((item as Record<string, unknown>).forecast) 
              : null,
            previous: (item as Record<string, unknown>).previous != null 
              ? String((item as Record<string, unknown>).previous) 
              : null,
          }));
        } else if (isChart && !result.chartSeries) {
          result.chartSeries = obj.map((item) => ({
            date: String((item as Record<string, unknown>).date || (item as Record<string, unknown>).x || ''),
            value: Number((item as Record<string, unknown>).value || (item as Record<string, unknown>).y || 0),
          }));
        }
      }

      obj.forEach((item) => this.extractFromNestedJson(item, result));
      return;
    }

    const record = obj as Record<string, unknown>;

    // Extract specific fields
    const keys = Object.keys(record);
    for (const key of keys) {
      const keyLower = key.toLowerCase();
      const value = record[key];

      if (
        (keyLower === 'nextrelease' || keyLower === 'next_release') &&
        !result.nextRelease &&
        value
      ) {
        result.nextRelease = String(value);
      }
      if (keyLower === 'source' && !result.source && typeof value === 'string') {
        result.source = value;
      }
      if (
        (keyLower === 'sourceurl' || keyLower === 'source_url') &&
        !result.sourceUrl &&
        typeof value === 'string'
      ) {
        result.sourceUrl = value;
      }
      if (keyLower === 'frequency' && !result.frequency && value) {
        result.frequency = String(value);
      }
      if ((keyLower === 'unit' || keyLower === 'units') && !result.unit && value) {
        result.unit = String(value);
      }
      if (
        (keyLower === 'history' || keyLower === 'values' || keyLower === 'data') &&
        Array.isArray(value) &&
        !result.history
      ) {
        this.extractFromNestedJson(value, result);
      }
      if (
        (keyLower === 'chart' || keyLower === 'chartseries' || keyLower === 'series') &&
        Array.isArray(value) &&
        !result.chartSeries
      ) {
        this.extractFromNestedJson(value, result);
      }

      // Recurse into nested objects
      if (typeof value === 'object' && value !== null) {
        this.extractFromNestedJson(value, result);
      }
    }
  }

  /**
   * Extract history data from HTML tables
   */
  private extractHistoryFromTable($: cheerio.CheerioAPI): HistoryEntry[] | undefined {
    const history: HistoryEntry[] = [];

    // Look for tables that might contain history data
    $('table').each((_, table) => {
      const headers = $(table)
        .find('thead th, tr:first-child th, tr:first-child td')
        .map((_, el) => $(el).text().trim().toLowerCase())
        .get();

      // Check if this looks like a history table
      const hasDateCol = headers.some((h) => h.includes('date') || h.includes('time'));
      const hasValueCol = headers.some(
        (h) =>
          h.includes('actual') ||
          h.includes('forecast') ||
          h.includes('previous') ||
          h.includes('value'),
      );

      if (hasDateCol || hasValueCol) {
        const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
        const actualIdx = headers.findIndex((h) => h.includes('actual'));
        const forecastIdx = headers.findIndex((h) => h.includes('forecast'));
        const previousIdx = headers.findIndex((h) => h.includes('previous'));

        $(table)
          .find('tbody tr, tr:not(:first-child)')
          .each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const entry: HistoryEntry = {
                date: dateIdx >= 0 ? $(cells[dateIdx]).text().trim() : '',
                actual: actualIdx >= 0 ? $(cells[actualIdx]).text().trim() || null : null,
                forecast: forecastIdx >= 0 ? $(cells[forecastIdx]).text().trim() || null : null,
                previous: previousIdx >= 0 ? $(cells[previousIdx]).text().trim() || null : null,
              };

              if (entry.date || entry.actual || entry.forecast) {
                history.push(entry);
              }
            }
          });

        if (history.length > 0) {
          return false; // break
        }
      }
    });

    return history.length > 0 ? history : undefined;
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

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}