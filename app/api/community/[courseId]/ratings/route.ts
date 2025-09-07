import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga plan EXPERTO o MAESTRO
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (
      !user ||
      (user.plan !== UserPlan.EXPERTO && user.plan !== UserPlan.MAESTRO)
    ) {
      return NextResponse.json({ error: 'Plan insuficiente' }, { status: 403 });
    }

    const { courseId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Verificar que el curso existe y es público
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        isPublic: true,
        deletedAt: null,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const [ratings, total] = await Promise.all([
      db.courseRating.findMany({
        where: { courseId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              plan: true,
            },
          },
        },
      }),
      db.courseRating.count({ where: { courseId } }),
    ]);

    // Obtener la calificación del usuario actual si existe
    const userRating = await db.courseRating.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    return NextResponse.json({
      ratings,
      userRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      courseStats: {
        totalRatings: course.totalRatings,
        averageRating: course.averageRating,
        totalCompletions: course.totalCompletions,
      },
    });
  } catch (error) {
    console.error('Error fetching course ratings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
