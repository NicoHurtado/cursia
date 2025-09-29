import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;

    if (!certificateId) {
      return NextResponse.json(
        { error: 'Certificate ID is required' },
        { status: 400 }
      );
    }

    // Find the certificate
    const certificate = await db.certificate.findUnique({
      where: { id: certificateId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        id: certificate.id,
        userId: certificate.user.id,
        userName: certificate.user.name,
        userEmail: certificate.user.email,
        courseId: certificate.course.id,
        courseName: certificate.course.title,
        courseDescription: certificate.course.description,
        completionDate: certificate.completedAt,
        issuedAt: certificate.createdAt,
      },
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
