import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { simpleAI } from '@/lib/ai/simple';
import { ModuleContentSchema } from '@/lib/dto/course';
import { UserPlan } from '@/lib/plans';

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

    // Check if course has metadata
    if (!course.title || !course.description) {
      return NextResponse.json(
        { error: 'Course metadata not ready' },
        { status: 400 }
      );
    }

    // Get existing modules with their chunks
    const existingModules = await db.module.findMany({
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

    // Find modules that don't have chunks (need content generation)
    const modulesToGenerate = existingModules.filter(
      module => module.chunks.length === 0
    );

    // Parse module list once at the beginning
    const moduleList = JSON.parse(course.moduleList);

    // Check if module 1 has content
    const module1 = existingModules.find(m => m.moduleOrder === 1);
    if (!module1 || module1.chunks.length === 0) {
      console.log('Module 1 not ready yet - content is being generated in background');
      return NextResponse.json(
        { 
          error: 'Module 1 content is still being generated. Please wait a moment and try again.',
          status: 'generating'
        },
        { status: 202 }
      );
    }

    // Course is ready to start - module 1 has content
    return NextResponse.json({
      success: true,
      message: 'Course started successfully',
      modulesReady: existingModules.filter(m => m.chunks.length > 0).length,
      totalModules: course.totalModules,
    });
  } catch (error) {
    console.error('Start course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
