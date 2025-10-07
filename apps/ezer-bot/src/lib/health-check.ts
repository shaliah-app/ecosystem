import { logger } from "../logger";
import { dependencyConfig } from "./config";
import { z } from "zod";

/**
 * Zod schema for health check response validation
 */
const HealthCheckResponseSchema = z.object({
  status: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * Zod schema for health check result validation
 */
const HealthCheckResultSchema = z.object({
  isOnline: z.boolean(),
  responseTime: z.number().positive().optional(),
  error: z.string().optional(),
});

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
    const startTime = Date.now();
    
    try {
      // Validate health URL with zod
      try {
        z.string().url().parse(this.healthUrl);
      } catch (error) {
        logger.error("Invalid health URL configuration", {
          url: this.healthUrl,
          error: error instanceof Error ? error.message : String(error),
          timeout: this.timeout,
        });
        return {
          isOnline: false,
          error: "Invalid health URL configuration"
        };
      }

      if (!this.healthUrl) {
        logger.warn("Health URL not configured, treating as offline", {
          timeout: this.timeout,
        });
        return {
          isOnline: false,
          error: "Health URL not configured"
        };
      }

      logger.info("Initiating health check request", {
        url: this.healthUrl,
        timeout: this.timeout,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        logger.warn("Health check timeout reached, aborting request", {
          url: this.healthUrl,
          timeout: this.timeout,
        });
        controller.abort();
      }, this.timeout);

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
        // Validate response body with zod if it's JSON
        try {
          const responseText = await response.text();
          if (responseText) {
            const responseData = JSON.parse(responseText);
            HealthCheckResponseSchema.parse(responseData);
            logger.info("Health check response validated successfully", {
              url: this.healthUrl,
              responseTime,
            });
          }
        } catch (parseError) {
          logger.warn("Health check response validation failed", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            url: this.healthUrl,
            responseTime,
            status: response.status,
          });
        }

        logger.info("Shaliah health check successful", {
          status: response.status,
          responseTime,
          url: this.healthUrl,
          timeout: this.timeout,
        });

        const result = {
          isOnline: true,
          responseTime,
        };

        // Validate result with zod
        const validationResult = HealthCheckResultSchema.safeParse(result);
        if (!validationResult.success) {
          logger.error("Health check result validation failed", {
            errors: validationResult.error.issues,
            result,
            url: this.healthUrl,
            responseTime,
          });
        }

        return result;
      } else {
        logger.warn("Shaliah health check failed with HTTP error", {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          url: this.healthUrl,
          timeout: this.timeout,
        });

        const result = {
          isOnline: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };

        // Validate result with zod
        const validationResult = HealthCheckResultSchema.safeParse(result);
        if (!validationResult.success) {
          logger.error("Health check result validation failed", {
            errors: validationResult.error.issues,
            result,
            url: this.healthUrl,
            responseTime,
          });
        }

        return result;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === "AbortError") {
        logger.warn("Shaliah health check timeout", {
          timeout: this.timeout,
          responseTime,
          url: this.healthUrl,
        });

        const result = {
          isOnline: false,
          responseTime,
          error: "Timeout",
        };

        // Validate result with zod
        const validationResult = HealthCheckResultSchema.safeParse(result);
        if (!validationResult.success) {
          logger.error("Health check result validation failed", {
            errors: validationResult.error.issues,
            result,
            url: this.healthUrl,
            responseTime,
          });
        }

        return result;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Shaliah health check failed with unexpected error", {
          error: errorMessage,
          errorName: error instanceof Error ? error.name : 'Unknown',
          responseTime,
          url: this.healthUrl,
          timeout: this.timeout,
        });

        const result = {
          isOnline: false,
          responseTime,
          error: errorMessage,
        };

        // Validate result with zod
        const validationResult = HealthCheckResultSchema.safeParse(result);
        if (!validationResult.success) {
          logger.error("Health check result validation failed", {
            errors: validationResult.error.issues,
            result,
            url: this.healthUrl,
            responseTime,
          });
        }

        return result;
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

/**
 * Simple health check function for testing
 * This function is used by tests and provides a simple boolean result
 */
export async function checkShaliahHealth(): Promise<boolean> {
  const client = createHealthCheckClient();
  const result = await client.checkHealth();
  return result.isOnline;
}
