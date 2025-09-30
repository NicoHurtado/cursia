import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get course
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user has completed the course
    const userProgress = await db.userProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    if (!userProgress || !userProgress.completedAt) {
      return NextResponse.json(
        { error: 'Course not completed' },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCertificate = await db.certificate.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        certificateId: existingCertificate.id,
        message: 'Certificate already exists',
      });
    }

    // Create new certificate
    const certificate = await db.certificate.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        completedAt: userProgress.completedAt,
      },
    });

    return NextResponse.json({
      success: true,
      certificateId: certificate.id,
      message: 'Certificate generated successfully',
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



