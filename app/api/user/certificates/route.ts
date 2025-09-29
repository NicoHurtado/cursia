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

    // Get user's certificates with course information
    const certificates = await db.certificate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Format certificates with verification URLs
    const formattedCertificates = certificates.map(certificate => ({
      id: certificate.id,
      courseId: certificate.courseId,
      course: certificate.course,
      completedAt: certificate.completedAt.toISOString(),
      createdAt: certificate.createdAt.toISOString(),
      verificationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-certificate/${certificate.id}`,
    }));

    return NextResponse.json({
      success: true,
      certificates: formattedCertificates,
      total: formattedCertificates.length,
    });
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
