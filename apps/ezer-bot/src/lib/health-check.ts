import { logger } from "../logger";
import { dependencyConfig } from "./config";

/**
 * Health check result
 */
export interface HealthCheckResult {
  isOnline: boolean;
  responseTime?: number;
  error?: string;
}

/**
 * HTTP client for Shaliah health checks
 */
export class HealthCheckClient {
  private readonly healthUrl: string;
  private readonly timeout: number;

  constructor(healthUrl: string, timeout: number) {
    this.healthUrl = healthUrl;
    this.timeout = timeout;
  }

  /**
   * Check if Shaliah is online by making a health check request
   */
  async checkHealth(): Promise<HealthCheckResult> {
    if (!this.healthUrl) {
      logger.warn("Health URL not configured, treating as offline");
      return {
        isOnline: false,
        error: "Health URL not configured"
      };
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.healthUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "EzerBot/1.0",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        logger.info("Shaliah health check successful", {
          status: response.status,
          responseTime,
          url: this.healthUrl,
        });

        return {
          isOnline: true,
          responseTime,
        };
      } else {
        logger.warn("Shaliah health check failed", {
          status: response.status,
          responseTime,
          url: this.healthUrl,
        });

        return {
          isOnline: false,
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === "AbortError") {
        logger.warn("Shaliah health check timeout", {
          timeout: this.timeout,
          responseTime,
          url: this.healthUrl,
        });

        return {
          isOnline: false,
          responseTime,
          error: "Timeout",
        };
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Shaliah health check error", {
          error: errorMessage,
          responseTime,
          url: this.healthUrl,
        });

        return {
          isOnline: false,
          responseTime,
          error: errorMessage,
        };
      }
    }
  }
}

/**
 * Create a health check client with current configuration
 */
export function createHealthCheckClient(): HealthCheckClient {
  return new HealthCheckClient(
    dependencyConfig.shaliahHealthUrl,
    dependencyConfig.dependencyCheckTimeout
  );
}
