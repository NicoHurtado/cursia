import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan } from '@/lib/plans';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in progress endpoint:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('No session found, returning unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    console.log(
      'Getting progress for course:',
      courseId,
      'user:',
      session.user.id
    );

    // Get user info to check plan
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can access community courses
    const canAccessCommunity =
      user.plan === UserPlan.EXPERTO || user.plan === UserPlan.MAESTRO;

    // Get user progress for this course
    const userProgress = await db.userProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    console.log('User progress found:', userProgress);

    if (!userProgress) {
      console.log('No user progress found, returning empty progress');
      // Return empty progress if no progress exists
      return NextResponse.json({
        completedChunks: [],
        completedModules: [],
        moduleProgress: {},
        completionPercentage: 0,
        currentModuleId: null,
        currentChunkId: null,
        quizAttempts: [],
      });
    }

    // Calculate module progress
    // Allow access if:
    // 1. User owns the course, OR
    // 2. Course is public (community course) and user has EXPERTO or MAESTRO plan
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { userId: session.user.id }, // User's own courses
          ...(canAccessCommunity
            ? [
                {
                  isPublic: true, // Public community courses
                  deletedAt: null, // Not deleted
                  userId: { not: session.user.id }, // Not owned by current user
                },
              ]
            : []),
        ],
      },
      include: {
        modules: {
          include: {
            chunks: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Parse the JSON strings from the database
    const completedChunksArray = JSON.parse(userProgress.completedChunks);
    const completedModulesArray = JSON.parse(userProgress.completedModules);
    const quizAttemptsArray = JSON.parse(userProgress.quizAttempts);

    const moduleProgress: { [key: number]: number } = {};

    course.modules.forEach(module => {
      const totalChunks = module.chunks.length;
      const completedChunks = completedChunksArray.filter((chunkId: string) =>
        module.chunks.some(chunk => chunk.id === chunkId)
      ).length;

      moduleProgress[module.moduleOrder] =
        totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;
    });

    // Calculate overall completion percentage
    const totalChunks = course.modules.reduce(
      (sum, module) => sum + module.chunks.length,
      0
    );
    const completionPercentage =
      totalChunks > 0
        ? Math.round((completedChunksArray.length / totalChunks) * 100)
        : 0;

    return NextResponse.json({
      completedChunks: completedChunksArray,
      completedModules: completedModulesArray,
      moduleProgress,
      completionPercentage,
      currentModuleId: userProgress.currentModuleId,
      currentChunkId: userProgress.currentChunkId,
      quizAttempts: quizAttemptsArray,
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
