import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Verify the course belongs to the user
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      include: {
        modules: {
          include: {
            chunks: true,
            quizzes: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get user progress
    const userProgress = await db.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (!userProgress) {
      return NextResponse.json(
        { error: 'No progress found for this course' },
        { status: 404 }
      );
    }

    // Check if all modules are completed
    const completedChunks = JSON.parse(userProgress.completedChunks);
    const completedModules = JSON.parse(userProgress.completedModules);
    const quizAttempts = JSON.parse(userProgress.quizAttempts);

    // Verify all chunks are completed
    const totalChunks = course.modules.reduce(
      (sum, module) => sum + module.chunks.length,
      0
    );

    if (completedChunks.length !== totalChunks) {
      return NextResponse.json(
        { error: 'Not all chunks are completed' },
        { status: 400 }
      );
    }

    // Verify all modules have passed quizzes
    for (const module of course.modules) {
      if (module.quizzes.length > 0) {
        const moduleQuizAttempts = quizAttempts.filter(
          (attempt: any) => attempt.moduleId === module.id
        );

        const hasPassedQuiz = moduleQuizAttempts.some(
          (attempt: any) => attempt.passed
        );

        if (!hasPassedQuiz) {
          return NextResponse.json(
            { error: `Module ${module.moduleOrder} quiz not passed` },
            { status: 400 }
          );
        }
      }
    }

    // Mark course as completed
    await db.userProgress.update({
      where: {
        id: userProgress.id,
      },
      data: {
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Finalize course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
