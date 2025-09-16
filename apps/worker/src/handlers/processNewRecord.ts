import type { Job } from 'pg-boss'

// Job data interface for process_new_record
interface ProcessNewRecordData {
  record_id: number
  record_type?: string
  metadata?: Record<string, any>
}

// Handler function for processing new records
export async function processNewRecord(job: Job<ProcessNewRecordData>) {
  console.log('🎵 Processing new record:', {
    jobId: job.id,
    recordId: job.data.record_id,
    recordType: job.data.record_type || 'unknown',
    metadata: job.data.metadata
  })

  try {
    // Simulate processing work
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Here you would implement the actual processing logic:
    // - Audio fingerprinting
    // - Stem separation
    // - Metadata extraction
    // - Database updates

    console.log('✅ Successfully processed record:', job.data.record_id)

    // Return success (pg-boss will mark the job as completed)
    return { success: true, recordId: job.data.record_id }

  } catch (error) {
    console.error('❌ Error processing record:', job.data.record_id, error)

    // Throw error to let pg-boss handle retries/failures
    throw new Error(`Failed to process record ${job.data.record_id}: ${error}`)
  }
}