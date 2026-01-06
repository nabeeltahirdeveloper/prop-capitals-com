import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()

export class AdminSettingsService {

  constructor(private prisma: PrismaService) {}

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

  create(data: any) {

    return this.prisma.platformSettings.create({

      data: {

        key: data.key,

        value: data.value,

        description: data.description,

      },

    });

  }

  update(key: string, data: any) {

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

        key: {

          startsWith: `${group}.`,

        },

      },

    });

    // Convert array of {key, value} to object {key: value}
    const result: Record<string, any> = {};

    for (const setting of settings) {

      const keyWithoutPrefix = setting.key.replace(`${group}.`, '');

      // Try to parse JSON values, fallback to string
      try {

        result[keyWithoutPrefix] = JSON.parse(setting.value);

      } catch {

        result[keyWithoutPrefix] = setting.value;

      }

    }

    return result;

  }

  async bulkUpdate(group: string, settings: Record<string, any>) {

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

      // Stringify non-string values
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      // Use upsert to create or update
      const result = await this.prisma.platformSettings.upsert({

        where: { key: fullKey },

        update: {

          value: stringValue,

        },

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

        // Try to parse JSON values, fallback to string
        try {

          groups[group][key] = JSON.parse(setting.value);

        } catch {

          groups[group][key] = setting.value;

        }

      }

    }

    return groups;

  }

}

