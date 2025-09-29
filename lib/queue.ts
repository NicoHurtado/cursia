import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

// Course generation queue
export const courseQueue = new Queue('course-generation', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export interface CourseGenerationJob {
  courseId: string;
  action: 'generate-remaining-modules';
}

export class QueueService {
  static async addCourseGenerationJob(data: CourseGenerationJob) {
    const job = await courseQueue.add('generate-course', data, {
      priority: 1,
    });

    console.log(
      `📋 Added course generation job ${job.id} for course ${data.courseId}`
    );
    return job;
  }

  static async getCourseGenerationStatus(courseId: string) {
    const jobs = await courseQueue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ]);
    return jobs.filter(job => job.data.courseId === courseId);
  }

  static async getQueueStats() {
    const waiting = await courseQueue.getWaiting();
    const active = await courseQueue.getActive();
    const completed = await courseQueue.getCompleted();
    const failed = await courseQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
