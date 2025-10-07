import { logger } from "../logger";
import { z } from "zod";

/**
 * Zod schema for environment variable validation
 */
const EnvironmentSchema = z.object({
  SHALIAH_HEALTH_URL: z
    .string()
    .url("SHALIAH_HEALTH_URL must be a valid URL")
    .optional(),
  DEPENDENCY_CHECK_TIMEOUT: z
    .string()
    .regex(/^\d+$/, "DEPENDENCY_CHECK_TIMEOUT must be a number")
    .optional(),
  NODE_ENV: z.enum(["production", "development", "test"]).optional(),
});

/**
 * Zod schema for dependency configuration validation
 */
const DependencyConfigSchema = z.object({
  shaliahHealthUrl: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Health URL must be a valid URL or empty string",
    }),
  dependencyCheckTimeout: z
    .number()
    .int()
    .min(1000, "Timeout must be at least 1000ms")
    .max(30000, "Timeout must be at most 30000ms"),
  nodeEnv: z.enum(["production", "development", "test"]),
  dependencyChecksEnabled: z.boolean(),
});

/**
 * Environment configuration for Ezer bot dependency checking
 */
export interface DependencyConfig {
  /** Shaliah health check URL */
  shaliahHealthUrl: string;
  /** Dependency check timeout in milliseconds */
  dependencyCheckTimeout: number;
  /** Node environment (development/test bypasses dependency checks) */
  nodeEnv: string;
  /** Whether dependency checks are enabled */
  dependencyChecksEnabled: boolean;
}

/**
 * Load and validate environment configuration
 */
export function loadDependencyConfig(): DependencyConfig {
  try {
    // Validate environment variables with zod
    const envResult = EnvironmentSchema.safeParse({
      SHALIAH_HEALTH_URL: process.env.SHALIAH_HEALTH_URL,
      DEPENDENCY_CHECK_TIMEOUT: process.env.DEPENDENCY_CHECK_TIMEOUT,
      NODE_ENV: process.env.NODE_ENV,
    });

    if (!envResult.success) {
      logger.error("Environment variable validation failed", {
        errors: envResult.error.issues,
      });
      throw new Error(
        `Environment validation failed: ${envResult.error.issues.map((e) => e.message).join(", ")}`,
      );
    }

    const env = envResult.data;
    const shaliahHealthUrl = env.SHALIAH_HEALTH_URL;
    const dependencyCheckTimeout = env.DEPENDENCY_CHECK_TIMEOUT
      ? parseInt(env.DEPENDENCY_CHECK_TIMEOUT, 10)
      : 5000;
    const nodeEnv = env.NODE_ENV || "production";

    // Validate required configuration
    if (!shaliahHealthUrl) {
      logger.warn(
        "SHALIAH_HEALTH_URL not configured - dependency checks will be disabled",
      );
    }

    // Validate timeout
    if (
      isNaN(dependencyCheckTimeout) ||
      dependencyCheckTimeout < 1000 ||
      dependencyCheckTimeout > 30000
    ) {
      logger.warn("Invalid DEPENDENCY_CHECK_TIMEOUT, using default 5000ms", {
        provided: process.env.DEPENDENCY_CHECK_TIMEOUT,
        default: 5000,
      });
    }

    // Determine if dependency checks are enabled
    const dependencyChecksEnabled =
      nodeEnv === "production" && !!shaliahHealthUrl;

    const config: DependencyConfig = {
      shaliahHealthUrl: shaliahHealthUrl || "",
      dependencyCheckTimeout:
        isNaN(dependencyCheckTimeout) ||
        dependencyCheckTimeout < 1000 ||
        dependencyCheckTimeout > 30000
          ? 5000
          : dependencyCheckTimeout,
      nodeEnv,
      dependencyChecksEnabled,
    };

    // Validate final configuration with zod
    const configResult = DependencyConfigSchema.safeParse(config);
    if (!configResult.success) {
      logger.error("Configuration validation failed", {
        errors: configResult.error.issues,
        config,
      });
      throw new Error(
        `Configuration validation failed: ${configResult.error.issues.map((e) => e.message).join(", ")}`,
      );
    }

    logger.info("Dependency configuration loaded and validated", {
      nodeEnv: config.nodeEnv,
      dependencyChecksEnabled: config.dependencyChecksEnabled,
      timeout: config.dependencyCheckTimeout,
      hasHealthUrl: !!config.shaliahHealthUrl,
    });

    return config;
  } catch (error) {
    logger.error("Failed to load dependency configuration", {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return safe defaults
    return {
      shaliahHealthUrl: "",
      dependencyCheckTimeout: 5000,
      nodeEnv: "production",
      dependencyChecksEnabled: false,
    };
  }
}

/**
 * Get the current dependency configuration
 * This is loaded once at module import time
 */
export const dependencyConfig = loadDependencyConfig();

/**
 * Reload dependency configuration (for testing)
 * This function allows tests to reload configuration when environment changes
 */
export function reloadDependencyConfig(): DependencyConfig {
  return loadDependencyConfig();
}

/**
 * Check if the application is in development mode
 * This function is used by tests
 */
export function isDevelopmentMode(): boolean {
  const nodeEnv = process.env.NODE_ENV || "production";
  return nodeEnv === "development" || nodeEnv === "test";
}
