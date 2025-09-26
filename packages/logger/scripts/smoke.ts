import { createLogger } from '../src/index';

const logger = createLogger({
  serviceName: 'smoke-test',
  environment: process.env.NODE_ENV || 'development',
  prettyPrint: true,
});

logger.info('Smoke test: logger initialized');
logger.captureException(new Error('Smoke test exception'));

console.log('Smoke test completed successfully');