import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;

    // Verify the course belongs to the user and is deleted
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
        deletedAt: { not: null },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Deleted course not found' }, { status: 404 });
    }

    // Permanent delete: delete the course and all related data
    await db.course.delete({
      where: {
        id: courseId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Course permanently deleted' 
    });

  } catch (error) {
    console.error('Error permanently deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
