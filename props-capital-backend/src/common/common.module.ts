import { Global, Module } from '@nestjs/common';
import { ResilientHttpService } from './resilient-http.service';

/**
 * Common module provides shared services across the application
 * 
 * Marked as @Global so services don't need to import CommonModule everywhere
 */
@Global()
@Module({
  providers: [ResilientHttpService],
  exports: [ResilientHttpService],
})
export class CommonModule {}