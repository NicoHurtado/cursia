import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get deleted courses for the user
    const deletedCourses = await db.course.findMany({
      where: {
        userId: session.user.id,
        deletedAt: { not: null },
      },
      include: {
        modules: {
          select: {
            id: true,
            moduleOrder: true,
            title: true,
          },
        },
        _count: {
          select: {
            modules: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const courses = deletedCourses.map(course => ({
      id: course.id,
      courseId: course.courseId,
      title: course.title,
      description: course.description,
      status: course.status,
      status_display:
        course.status === 'complete'
          ? 'COMPLETE'
          : course.status === 'failed'
            ? 'FAILED'
            : 'READY',
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      completedAt: course.completedAt?.toISOString() || null,
      deletedAt: course.deletedAt?.toISOString() || null,
      totalModules: course.totalModules,
      completedModules: course.modules.filter(
        m => m.moduleOrder <= course.totalModules
      ).length,
    }));

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching deleted courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
