import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan } from '@prisma/client';

export async function POST(request: NextRequest) {
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

    const { courseId, rating, comment } = await request.json();

    if (!courseId || !rating) {
      return NextResponse.json(
        { error: 'ID del curso y calificación requeridos' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

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

    // Verificar que el usuario no sea el propietario del curso
    if (course.userId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes calificar tu propio curso' },
        { status: 400 }
      );
    }

    // Usar transacción para actualizar rating y crear/actualizar la calificación
    const result = await db.$transaction(async tx => {
      // Crear o actualizar la calificación del usuario
      const courseRating = await tx.courseRating.upsert({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId,
          },
        },
        update: {
          rating,
          comment: comment || null,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          courseId: courseId,
          rating,
          comment: comment || null,
        },
      });

      // Recalcular estadísticas del curso
      const ratings = await tx.courseRating.findMany({
        where: { courseId },
        select: { rating: true },
      });

      const totalRatings = ratings.length;
      const averageRating =
        totalRatings > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
          : 0;

      // Actualizar estadísticas del curso
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: {
          totalRatings,
          averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
        },
      });

      return { courseRating, updatedCourse };
    });

    return NextResponse.json({
      message: 'Calificación guardada exitosamente',
      rating: result.courseRating,
      courseStats: {
        totalRatings: result.updatedCourse.totalRatings,
        averageRating: result.updatedCourse.averageRating,
      },
    });
  } catch (error) {
    console.error('Error rating course:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
