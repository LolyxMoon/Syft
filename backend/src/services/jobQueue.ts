/**
 * Simple In-Memory Job Queue for Long-Running Tasks
 * Handles vault generation jobs that exceed Heroku's 30s timeout
 */

interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private readonly JOB_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new job
   */
  createJob(id: string): void {
    this.jobs.set(id, {
      id,
      status: 'pending',
      createdAt: new Date(),
    });
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      this.jobs.delete(id);
    }, this.JOB_EXPIRY_MS);
  }

  /**
   * Mark job as processing
   */
  markProcessing(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'processing';
    }
  }

  /**
   * Complete a job with result
   */
  completeJob(id: string, result: any): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
    }
  }

  /**
   * Fail a job with error
   */
  failJob(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date();
    }
  }

  /**
   * Get job status and result
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Check if job exists
   */
  hasJob(id: string): boolean {
    return this.jobs.has(id);
  }
}

// Export singleton
export const jobQueue = new JobQueue();
