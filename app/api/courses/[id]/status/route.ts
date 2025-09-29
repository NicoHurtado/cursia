import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Get course status and progress
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      select: {
        status: true,
        totalModules: true,
        modules: {
          select: {
            id: true,
            chunks: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Calculate progress based on status and modules
    let progress = 0;

    switch (course.status) {
      case 'GENERATING_METADATA':
        progress = 15;
        break;
      case 'METADATA_READY':
        progress = 30;
        break;
      case 'GENERATING_MODULE_1':
        progress = 50;
        break;
      case 'READY':
        progress = 85;
        break;
      case 'COMPLETE':
        progress = 100;
        break;
      default:
        // Calculate based on modules with content
        const modulesWithContent = course.modules.filter(
          module => module.chunks.length > 0
        );
        const baseProgress = Math.min(
          (modulesWithContent.length / course.totalModules) * 80,
          80
        );
        progress = Math.max(baseProgress, 10); // Minimum 10% progress
    }

    return NextResponse.json({
      status: course.status,
      progress: Math.round(progress),
      modulesReady: course.modules.filter(m => m.chunks.length > 0).length,
      totalModules: course.totalModules,
    });
  } catch (error) {
    console.error('Error fetching course status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
