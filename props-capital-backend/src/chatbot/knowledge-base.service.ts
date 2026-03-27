import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KnowledgeBaseService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  private readonly KB_PATH = path.resolve(
    process.cwd(),
    'src/knowledge-base/prop_capitals_kb.md',
  );

  private cachedContent = '';
  private lastLoaded: Date | null = null;

  onModuleInit() {
    this.load();
  }

  getContent(): string {
    return this.cachedContent;
  }

  reload(): { message: string; lastLoaded: Date } {
    this.load();
    return { message: 'Knowledge base reloaded successfully', lastLoaded: this.lastLoaded! };
  }

  private load(): void {
    try {
      this.cachedContent = fs.readFileSync(this.KB_PATH, 'utf-8');
      this.lastLoaded = new Date();
      this.logger.log(`Knowledge base loaded — ${this.cachedContent.length} chars`);
    } catch (err) {
      this.logger.error(`Cannot load knowledge base from: ${this.KB_PATH}`);
      if (!this.cachedContent) {
        throw new Error('Knowledge base missing. Check KB_PATH in knowledge-base.service.ts');
      }
    }
  }
}