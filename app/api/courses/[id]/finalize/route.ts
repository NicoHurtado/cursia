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

    // Get course
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
          orderBy: { moduleOrder: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get user progress
    const userProgress = await db.userProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    if (!userProgress) {
      return NextResponse.json(
        { error: 'User progress not found' },
        { status: 404 }
      );
    }

    // Check if course is already completed
    if (userProgress.completedAt) {
      // Find existing certificate
      const existingCertificate = await db.certificate.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
        },
      });

      if (existingCertificate) {
        return NextResponse.json({
          success: true,
          message: 'Course already completed',
          completedAt: userProgress.completedAt,
          certificateId: existingCertificate.id,
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            topics: course.topics,
            moduleList: course.moduleList,
          },
          user: {
            id: session.user.id,
            name: session.user.name || 'Usuario',
            email: session.user.email || 'usuario@ejemplo.com',
          },
        });
      }
    }

    // Calculate total chunks and completed chunks
    const totalChunks = course.modules.reduce(
      (total, module) => total + module.chunks.length,
      0
    );
    const completedChunks = JSON.parse(userProgress.completedChunks || '[]');

    console.log('Course completion check:', {
      totalChunks,
      completedChunks: completedChunks.length,
      completedChunkIds: completedChunks,
      userProgressCompletedAt: userProgress.completedAt,
    });

    // Check if all chunks are completed
    if (completedChunks.length < totalChunks) {
      console.log('Course not fully completed, returning error');
      return NextResponse.json(
        {
          error: 'Course not fully completed',
          completedChunks: completedChunks.length,
          totalChunks: totalChunks,
        },
        { status: 400 }
      );
    }

    // Mark course as completed
    const updatedProgress = await db.userProgress.update({
      where: {
        id: userProgress.id,
      },
      data: {
        completedAt: new Date(),
      },
    });

    console.log('Course marked as completed:', {
      progressId: updatedProgress.id,
      completedAt: updatedProgress.completedAt,
    });

    // Generate certificate
    const certificate = await db.certificate.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        completedAt: new Date(),
      },
    });

    console.log('Certificate created:', {
      id: certificate.id,
      userId: certificate.userId,
      courseId: certificate.courseId,
      completedAt: certificate.completedAt,
    });

    // Validate session data
    console.log('Session data:', {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
    });

    if (!session.user.name) {
      console.warn('Session user name is undefined, using fallback');
    }

    const responseData = {
      success: true,
      message: 'Course completed successfully',
      completedAt: updatedProgress.completedAt,
      certificateId: certificate.id,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        topics: course.topics,
        moduleList: course.moduleList,
      },
      user: {
        id: session.user.id,
        name: session.user.name || 'Usuario',
        email: session.user.email || 'usuario@ejemplo.com',
      },
    };

    console.log('Finalize response data:', responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Finalize course error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
