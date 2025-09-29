import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;

    // Get the module and verify it belongs to a course accessible by the user
    const module = await db.module.findFirst({
      where: {
        id: moduleId,
        OR: [
          {
            course: {
              userId: session.user.id,
            },
          },
          {
            course: {
              isPublic: true,
              deletedAt: null,
            },
          },
        ],
      },
      include: {
        course: true,
      },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get user progress to check quiz attempts
    const userProgress = await db.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: module.courseId,
        },
      },
    });

    if (!userProgress) {
      return NextResponse.json({
        attempts: [],
        bestScore: null,
        passed: false,
        totalAttempts: 0,
      });
    }

    // Parse quiz attempts and filter for this module
    const allQuizAttempts = JSON.parse(userProgress.quizAttempts || '[]');
    const moduleAttempts = allQuizAttempts.filter(
      (attempt: any) => attempt.moduleId === moduleId
    );

    // Calculate statistics
    const bestScore =
      moduleAttempts.length > 0
        ? Math.max(...moduleAttempts.map((attempt: any) => attempt.score))
        : null;

    const passed = moduleAttempts.some((attempt: any) => attempt.passed);
    const totalAttempts = moduleAttempts.length;

    // Get the latest attempt details
    const latestAttempt =
      moduleAttempts.length > 0
        ? moduleAttempts[moduleAttempts.length - 1]
        : null;

    return NextResponse.json({
      attempts: moduleAttempts,
      bestScore,
      passed,
      totalAttempts,
      latestAttempt,
    });
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
