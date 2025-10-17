import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    // Check if we can access environment variables
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasYouTubeKey = !!process.env.YOUTUBE_DATA_API_KEY;

    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        database: 'healthy',
        anthropic: hasAnthropicKey ? 'configured' : 'not_configured',
        youtube: hasYouTubeKey ? 'configured' : 'not_configured',
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(health);
  } catch (error) {
    const responseTime = Date.now() - startTime;

    const health = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'error',
        anthropic: 'unknown',
        youtube: 'unknown',
      },
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(health, { status: 503 });
  }
}
