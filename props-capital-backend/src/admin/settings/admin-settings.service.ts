import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ALLOWED_KEYS, SENSITIVE_KEYS, SettingsGroup } from './dto/bulk-update-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  private maskSensitiveValue(fullKey: string, value: string): string {
    if (!SENSITIVE_KEYS.includes(fullKey) || !value) return value;
    if (value.length <= 4) return '****';
    return '****' + value.slice(-4);
  }

  private isMaskedValue(value: string): boolean {
    return typeof value === 'string' && value.startsWith('****');
  }

  getAll() {
    return this.prisma.platformSettings.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  getByKey(key: string) {
    return this.prisma.platformSettings.findUnique({
      where: { key },
    });
  }

  create(data: { key: string; value: string; description?: string }) {
    return this.prisma.platformSettings.create({
      data: {
        key: data.key,
        value: data.value,
        description: data.description,
      },
    });
  }

  update(key: string, data: { value: string; description?: string }) {
    return this.prisma.platformSettings.update({
      where: { key },
      data: {
        value: data.value,
        description: data.description,
      },
    });
  }

  delete(key: string) {
    return this.prisma.platformSettings.delete({
      where: { key },
    });
  }

  async getByGroup(group: string) {
    const settings = await this.prisma.platformSettings.findMany({
      where: {
        key: { startsWith: `${group}.` },
      },
    });

    const result: Record<string, any> = {};

    for (const setting of settings) {
      const keyWithoutPrefix = setting.key.replace(`${group}.`, '');
      let parsed: any;
      try {
        parsed = JSON.parse(setting.value);
      } catch {
        parsed = setting.value;
      }

      // Mask sensitive values in responses
      if (typeof parsed === 'string') {
        parsed = this.maskSensitiveValue(setting.key, parsed);
      }

      result[keyWithoutPrefix] = parsed;
    }

    return result;
  }

  async bulkUpdate(group: string, settings: Record<string, any>) {
    // Validate keys against whitelist
    const allowedKeys = ALLOWED_KEYS[group as SettingsGroup];
    if (allowedKeys) {
      for (const key of Object.keys(settings)) {
        if (!allowedKeys.includes(key)) {
          throw new BadRequestException(
            `Invalid setting key '${key}' for group '${group}'. Allowed: ${allowedKeys.join(', ')}`,
          );
        }
      }
    }

    const results: Array<{
      id: string;
      key: string;
      value: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const [key, value] of Object.entries(settings)) {
      const fullKey = `${group}.${key}`;

      // Skip masked values (don't overwrite stored key with mask)
      if (typeof value === 'string' && this.isMaskedValue(value)) {
        continue;
      }

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      const result = await this.prisma.platformSettings.upsert({
        where: { key: fullKey },
        update: { value: stringValue },
        create: {
          key: fullKey,
          value: stringValue,
          description: null,
        },
      });

      results.push(result);
    }

    return results;
  }

  async getAllGroups() {
    const allSettings = await this.prisma.platformSettings.findMany({
      orderBy: { key: 'asc' },
    });

    const groups: Record<string, Record<string, any>> = {};

    for (const setting of allSettings) {
      const parts = setting.key.split('.');

      if (parts.length >= 2) {
        const group = parts[0];
        const key = parts.slice(1).join('.');

        if (!groups[group]) {
          groups[group] = {};
        }

        let parsed: any;
        try {
          parsed = JSON.parse(setting.value);
        } catch {
          parsed = setting.value;
        }

        // Mask sensitive values in responses
        if (typeof parsed === 'string') {
          parsed = this.maskSensitiveValue(setting.key, parsed);
        }

        groups[group][key] = parsed;
      }
    }

    return groups;
  }
}
