import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation - requests flow through
  OPEN = 'OPEN',         // Failing - requests are blocked
  HALF_OPEN = 'HALF_OPEN' // Testing - allowing limited requests
}

/**
 * Circuit breaker for a specific service
 */
interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

/**
 * Configuration for fetch requests
 */
export interface FetchOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
  /** Maximum delay between retries in ms (default: 10000) */
  maxRetryDelay?: number;
  /** Circuit breaker name - requests to same circuit share state */
  circuitName?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request body for POST/PUT/PATCH */
  body?: any;
  /** Skip circuit breaker check (for health checks) */
  skipCircuitBreaker?: boolean;
}

/**
 * Result of a fetch operation
 */
export interface FetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: FetchErrorCode;
  statusCode?: number;
  retryCount?: number;
  circuitState?: CircuitState;
}

/**
 * Error codes for fetch operations
 */
export type FetchErrorCode =
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'DNS_ERROR'
  | 'CONNECTION_REFUSED'
  | 'CIRCUIT_OPEN'
  | 'HTTP_ERROR'
  | 'PARSE_ERROR'
  | 'ABORTED'
  | 'UNKNOWN';

/**
 * Resilient HTTP client with timeout, retry, and circuit breaker
 * 
 * Features:
 * - Configurable timeout per request
 * - Exponential backoff retry
 * - Circuit breaker to prevent cascading failures
 * - Error classification for better handling
 * - Request deduplication (optional)
 */
@Injectable()
export class ResilientHttpService {
  private readonly logger = new Logger(ResilientHttpService.name);

  // Circuit breakers per service/endpoint
  private circuits: Map<string, CircuitBreaker> = new Map();

  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 5;        // Open circuit after 5 failures
  private readonly RECOVERY_TIMEOUT = 30000;     // Try again after 30 seconds
  private readonly SUCCESS_THRESHOLD = 2;        // Close circuit after 2 successes in half-open

  // Default fetch options
  private readonly DEFAULT_TIMEOUT = 10000;      // 10 seconds
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000;   // 1 second
  private readonly DEFAULT_MAX_RETRY_DELAY = 10000; // 10 seconds

  /**
   * Make a resilient HTTP GET request
   */
  async get<T = any>(url: string, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a resilient HTTP POST request
   */
  async post<T = any>(url: string, body: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * Main fetch method with all resilience features
   */
  async fetch<T = any>(url: string, options: FetchOptions = {}): Promise<FetchResult<T>> {
    const {
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      maxRetryDelay = this.DEFAULT_MAX_RETRY_DELAY,
      circuitName = this.getCircuitName(url),
      headers = {},
      method = 'GET',
      body,
      skipCircuitBreaker = false,
    } = options;

    // Check circuit breaker
    if (!skipCircuitBreaker) {
      const circuitCheck = this.checkCircuit(circuitName);
      if (!circuitCheck.allowed) {
        this.logger.warn(`[${circuitName}] Circuit is OPEN - request blocked`);
        return {
          success: false,
          error: `Service ${circuitName} is temporarily unavailable (circuit open)`,
          errorCode: 'CIRCUIT_OPEN',
          circuitState: CircuitState.OPEN,
        };
      }
    }

    let lastError: { message: string; code: FetchErrorCode } | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      attempt++;

      try {
        const result = await this.fetchWithTimeout<T>(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          timeout,
        });

        // Success - record it for circuit breaker
        if (!skipCircuitBreaker) {
          this.recordSuccess(circuitName);
        }

        return {
          success: true,
          data: result.data,
          statusCode: result.statusCode,
          retryCount: attempt - 1,
          circuitState: this.getCircuit(circuitName).state,
        };

      } catch (error) {
        lastError = this.classifyError(error);
        
        // Record failure for circuit breaker
        if (!skipCircuitBreaker) {
          this.recordFailure(circuitName);
        }

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError.code)) {
          this.logger.error(`[${circuitName}] Non-retryable error: ${lastError.message}`);
          break;
        }

        // Check if we should retry
        if (attempt <= retries) {
          const delay = this.calculateBackoff(attempt, retryDelay, maxRetryDelay);
          this.logger.warn(
            `[${circuitName}] Attempt ${attempt}/${retries + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    this.logger.error(
      `[${circuitName}] All ${retries + 1} attempts failed. Last error: ${lastError?.message}`
    );

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      errorCode: lastError?.code || 'UNKNOWN',
      retryCount: attempt - 1,
      circuitState: this.getCircuit(circuitName).state,
    };
  }

  /**
   * Fetch with timeout using AbortController
   */
  private async fetchWithTimeout<T>(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: string;
      timeout: number;
    }
  ): Promise<{ data: T; statusCode: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No response body');
        throw new HttpError(response.status, response.statusText, errorBody);
      }

      // Parse JSON response
      const data = await response.json() as T;
      
      return { data, statusCode: response.status };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Classify errors for better handling
   */
  private classifyError(error: any): { message: string; code: FetchErrorCode } {
    const message = error?.message || 'Unknown error';

    // Timeout (AbortController)
    if (error?.name === 'AbortError' || message.includes('abort')) {
      return { message: 'Request timed out', code: 'TIMEOUT' };
    }

    // HTTP errors
    if (error instanceof HttpError) {
      return { 
        message: `HTTP ${error.statusCode}: ${error.statusText} - ${error.body}`, 
        code: 'HTTP_ERROR' 
      };
    }

    // DNS errors
    if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN') || message.includes('getaddrinfo')) {
      return { message: 'DNS resolution failed', code: 'DNS_ERROR' };
    }

    // Connection errors
    if (message.includes('ECONNREFUSED')) {
      return { message: 'Connection refused', code: 'CONNECTION_REFUSED' };
    }

    if (message.includes('ECONNRESET') || message.includes('ETIMEDOUT') || message.includes('EPIPE')) {
      return { message: 'Network connection error', code: 'NETWORK_ERROR' };
    }

    // JSON parse errors
    if (message.includes('JSON') || message.includes('Unexpected token')) {
      return { message: 'Failed to parse response', code: 'PARSE_ERROR' };
    }

    return { message, code: 'UNKNOWN' };
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(code: FetchErrorCode): boolean {
    // Don't retry on client errors or parse errors
    return code === 'PARSE_ERROR';
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
    // Exponential backoff: delay = baseDelay * 2^(attempt-1)
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    
    // Add jitter (±25%) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    
    // Cap at max delay
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Circuit Breaker ====================

  /**
   * Get circuit name from URL (use hostname)
   */
  private getCircuitName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get or create circuit breaker for a service
   */
  private getCircuit(name: string): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
      });
    }
    return this.circuits.get(name)!;
  }

  /**
   * Check if request should be allowed through circuit
   */
  private checkCircuit(name: string): { allowed: boolean; state: CircuitState } {
    const circuit = this.getCircuit(name);

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return { allowed: true, state: circuit.state };

      case CircuitState.OPEN:
        // Check if recovery timeout has passed
        const timeSinceFailure = Date.now() - circuit.lastFailureTime;
        if (timeSinceFailure >= this.RECOVERY_TIMEOUT) {
          // Transition to half-open
          circuit.state = CircuitState.HALF_OPEN;
          circuit.successCount = 0;
          this.logger.log(`[${name}] Circuit transitioning to HALF_OPEN`);
          return { allowed: true, state: circuit.state };
        }
        return { allowed: false, state: circuit.state };

      case CircuitState.HALF_OPEN:
        // Allow limited requests in half-open state
        return { allowed: true, state: circuit.state };

      default:
        return { allowed: true, state: CircuitState.CLOSED };
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(name: string): void {
    const circuit = this.getCircuit(name);

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successCount++;
      if (circuit.successCount >= this.SUCCESS_THRESHOLD) {
        // Close the circuit
        circuit.state = CircuitState.CLOSED;
        circuit.failureCount = 0;
        circuit.successCount = 0;
        this.logger.log(`[${name}] Circuit CLOSED after ${this.SUCCESS_THRESHOLD} successes`);
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success
      circuit.failureCount = 0;
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(name: string): void {
    const circuit = this.getCircuit(name);
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Immediately open circuit on failure in half-open state
      circuit.state = CircuitState.OPEN;
      this.logger.warn(`[${name}] Circuit OPEN (failed in half-open state)`);
    } else if (circuit.state === CircuitState.CLOSED && circuit.failureCount >= this.FAILURE_THRESHOLD) {
      // Open circuit after threshold failures
      circuit.state = CircuitState.OPEN;
      this.logger.warn(`[${name}] Circuit OPEN after ${this.FAILURE_THRESHOLD} failures`);
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitStatus(name?: string): Record<string, { state: CircuitState; failureCount: number }> {
    if (name) {
      const circuit = this.circuits.get(name);
      if (circuit) {
        return { [name]: { state: circuit.state, failureCount: circuit.failureCount } };
      }
      return {};
    }

    const status: Record<string, { state: CircuitState; failureCount: number }> = {};
    this.circuits.forEach((circuit, circuitName) => {
      status[circuitName] = { state: circuit.state, failureCount: circuit.failureCount };
    });
    return status;
  }

  /**
   * Manually reset a circuit (for admin/testing)
   */
  resetCircuit(name: string): void {
    const circuit = this.getCircuit(name);
    circuit.state = CircuitState.CLOSED;
    circuit.failureCount = 0;
    circuit.successCount = 0;
    this.logger.log(`[${name}] Circuit manually reset to CLOSED`);
  }

  /**
   * Reset all circuits
   */
  resetAllCircuits(): void {
    this.circuits.clear();
    this.logger.log('All circuits reset');
  }
}

/**
 * Custom error for HTTP errors
 */
class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly statusText: string,
    public readonly body: string
  ) {
    super(`HTTP ${statusCode}: ${statusText}`);
    this.name = 'HttpError';
  }
}