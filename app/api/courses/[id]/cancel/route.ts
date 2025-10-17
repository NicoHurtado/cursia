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

    // Get the course and verify ownership
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Only allow cancellation if course is still being generated
    if (course.status === 'COMPLETE' || course.status === 'READY') {
      return NextResponse.json(
        { error: 'Course is already completed and cannot be cancelled' },
        { status: 400 }
      );
    }

    // Mark course as cancelled by setting it to FAILED status
    await db.course.update({
      where: { id: courseId },
      data: {
        status: 'FAILED',
        // Add a note that it was cancelled by user
        description: 'Curso cancelado por el usuario durante la generación.',
      },
    });

    console.log(`❌ Course ${courseId} cancelled by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Course creation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling course creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
