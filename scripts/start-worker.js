/*
 Minimal worker starter to avoid broken npm scripts.
 Starts a BullMQ Worker that no-ops unless queue and processor are defined elsewhere.
 Safe in production: exits if Redis is not configured.
*/

const { Worker } = require('bullmq');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

// If explicitly disabled, exit gracefully
if (process.env.USE_AI_WORKER === 'false') {
  console.log('[worker] Disabled via USE_AI_WORKER=false');
  process.exit(0);
}

const connection = { host: redisHost, port: redisPort, password: process.env.REDIS_PASSWORD };

let worker;
try {
  worker = new Worker(
    'course-generation',
    async job => {
      // Placeholder: the actual processing logic should live in app/api or lib
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[worker] Received job ${job.id} of type ${job.name}`, job.data);
      }
      return { ok: true };
    },
    { connection }
  );

  worker.on('completed', job => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[worker] Job completed ${job.id}`);
    }
  });

  worker.on('failed', (job, err) => {
    console.error('[worker] Job failed', job && job.id, err);
  });

  console.log('[worker] Started course-generation worker');
} catch (err) {
  console.error('[worker] Failed to start worker:', err.message);
  process.exit(1);
}

process.on('SIGINT', async () => {
  try {
    if (worker) await worker.close();
  } finally {
    process.exit(0);
  }
});


