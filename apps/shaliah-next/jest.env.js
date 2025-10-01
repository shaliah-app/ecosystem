// Load test environment variables
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
loadEnvConfig(projectDir, true, { envFiles: ['.env.test'] })