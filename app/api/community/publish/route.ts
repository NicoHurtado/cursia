import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga plan MAESTRO
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    });

    if (!user || user.plan !== UserPlan.MAESTRO) {
      return NextResponse.json({ error: 'Solo usuarios con plan MAESTRO pueden publicar cursos' }, { status: 403 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'ID del curso requerido' }, { status: 400 });
    }

    // Verificar que el curso existe y pertenece al usuario
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
        deletedAt: null
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Publicar el curso
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        isPublic: true,
        publishedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            plan: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Curso publicado exitosamente',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Error publishing course:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
