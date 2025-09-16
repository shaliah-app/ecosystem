import { boss, stopBoss } from './boss.js'
import { processNewRecord } from './handlers/processNewRecord.js'

// Job handler registry - maps job names to handler functions
const jobHandlers = {
  'process_new_record': processNewRecord,
  // Add more job handlers here as needed:
  // 'process_audio_fingerprint': processAudioFingerprint,
  // 'separate_audio_stems': separateAudioStems,
} as const

// Type for job names
type JobName = keyof typeof jobHandlers

async function startWorker() {
  try {
    console.log('🚀 Starting Yesod Worker...')

    // Start pg-boss
    await boss.start()
    console.log('✅ Connected to database and started job queue')

    // Register all job handlers
    for (const [jobName, handler] of Object.entries(jobHandlers)) {
      await boss.work(jobName as JobName, handler)
      console.log(`📋 Registered handler for job: ${jobName}`)
    }

    console.log('🎯 Worker is ready and listening for jobs!')
    console.log('Press Ctrl+C to stop the worker gracefully')

  } catch (error) {
    console.error('❌ Failed to start worker:', error)
    process.exit(1)
  }
}

// Graceful shutdown handlers
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`)

  try {
    // Stop accepting new jobs
    await boss.stop({ graceful: true })
    console.log('✅ Worker stopped accepting new jobs')

    // Give running jobs time to complete (configurable)
    const gracePeriodMs = 10000 // 10 seconds
    console.log(`⏳ Waiting up to ${gracePeriodMs / 1000}s for running jobs to complete...`)

    // Wait for running jobs to complete
    await new Promise(resolve => setTimeout(resolve, gracePeriodMs))

    console.log('✅ Graceful shutdown completed')
    process.exit(0)

  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error)
    process.exit(1)
  }
}

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the worker
startWorker()