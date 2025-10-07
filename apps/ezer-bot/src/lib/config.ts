import { logger } from "../logger";

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
  const shaliahHealthUrl = process.env.SHALIAH_HEALTH_URL;
  const dependencyCheckTimeout = parseInt(process.env.DEPENDENCY_CHECK_TIMEOUT || "5000", 10);
  const nodeEnv = process.env.NODE_ENV || "production";

  // Validate required configuration
  if (!shaliahHealthUrl) {
    logger.warn("SHALIAH_HEALTH_URL not configured - dependency checks will be disabled");
  }

  // Validate timeout
  if (isNaN(dependencyCheckTimeout) || dependencyCheckTimeout < 1000 || dependencyCheckTimeout > 30000) {
    logger.warn("Invalid DEPENDENCY_CHECK_TIMEOUT, using default 5000ms", {
      provided: process.env.DEPENDENCY_CHECK_TIMEOUT,
      default: 5000
    });
  }

  // Determine if dependency checks are enabled
  const dependencyChecksEnabled = nodeEnv === "production" && !!shaliahHealthUrl;

  const config: DependencyConfig = {
    shaliahHealthUrl: shaliahHealthUrl || "",
    dependencyCheckTimeout: isNaN(dependencyCheckTimeout) || dependencyCheckTimeout < 1000 || dependencyCheckTimeout > 30000 
      ? 5000 
      : dependencyCheckTimeout,
    nodeEnv,
    dependencyChecksEnabled,
  };

  logger.info("Dependency configuration loaded", {
    nodeEnv: config.nodeEnv,
    dependencyChecksEnabled: config.dependencyChecksEnabled,
    timeout: config.dependencyCheckTimeout,
    hasHealthUrl: !!config.shaliahHealthUrl,
  });

  return config;
}

/**
 * Get the current dependency configuration
 */
export const dependencyConfig = loadDependencyConfig();
