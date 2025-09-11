import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan } from '@/lib/plans';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in mark-chunk-complete:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('No session found in mark-chunk-complete');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const { chunkId, updatePosition = false } = await request.json();
    console.log('Marking chunk complete:', {
      courseId,
      chunkId,
      updatePosition,
    });

    if (!chunkId) {
      return NextResponse.json(
        { error: 'chunkId is required' },
        { status: 400 }
      );
    }

    // Get user info to check plan
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can access community courses
    const canAccessCommunity = user.plan === UserPlan.EXPERTO || user.plan === UserPlan.MAESTRO;

    // Verify the course can be accessed by the user
    // Allow access if:
    // 1. User owns the course, OR
    // 2. Course is public (community course) and user has EXPERTO or MAESTRO plan
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { userId: session.user.id }, // User's own courses
          ...(canAccessCommunity ? [
            {
              isPublic: true, // Public community courses
              deletedAt: null, // Not deleted
              userId: { not: session.user.id }, // Not owned by current user
            }
          ] : []),
        ],
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify the chunk exists and belongs to the course
    const chunk = await db.chunk.findFirst({
      where: {
        id: chunkId,
        module: {
          courseId: courseId,
        },
      },
      include: {
        module: true,
      },
    });

    if (!chunk) {
      return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
    }

    // Get or create user progress
    let userProgress = await db.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (!userProgress) {
      console.log('Creating new user progress record');
      userProgress = await db.userProgress.create({
        data: {
          userId: session.user.id,
          courseId: courseId,
          currentModuleId: chunk.module.id,
          currentChunkId: chunkId,
        },
      });
      console.log('User progress created:', userProgress.id);
    } else {
      console.log('Updating existing user progress:', userProgress.id);
    }

    // Parse completed chunks
    const completedChunks = JSON.parse(userProgress.completedChunks);

    // Add chunk if not already completed (only if not just updating position)
    if (!updatePosition && !completedChunks.includes(chunkId)) {
      completedChunks.push(chunkId);
    }

    // Update progress
    await db.userProgress.update({
      where: {
        id: userProgress.id,
      },
      data: {
        completedChunks: JSON.stringify(completedChunks),
        currentModuleId: chunk.module.id,
        currentChunkId: chunkId,
      },
    });

    // Calculate progress percentages
    const totalChunks = await db.chunk.count({
      where: {
        module: {
          courseId: courseId,
        },
      },
    });

    const completionPercentage = Math.round(
      (completedChunks.length / totalChunks) * 100
    );

    // Calculate module progress
    const modules = await db.module.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        chunks: true,
      },
      orderBy: {
        moduleOrder: 'asc',
      },
    });

    const moduleProgress: { [key: number]: number } = {};

    for (const module of modules) {
      const moduleCompletedChunks = completedChunks.filter((chunkId: string) =>
        module.chunks.some(chunk => chunk.id === chunkId)
      );
      moduleProgress[module.moduleOrder] = Math.round(
        (moduleCompletedChunks.length / module.chunks.length) * 100
      );
    }

    return NextResponse.json({
      completion_percentage: completionPercentage,
      module_progress: moduleProgress,
    });
  } catch (error) {
    console.error('Mark chunk complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
