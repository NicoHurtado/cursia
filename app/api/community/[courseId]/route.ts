import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { courseId } = await params;

    // Verificar que el curso existe y pertenece al usuario
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
        isPublic: true,
        deletedAt: null
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado o no tienes permisos' }, { status: 404 });
    }

    // Despublicar el curso (no eliminarlo, solo quitarle la visibilidad pública)
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        isPublic: false,
        publishedAt: null
      }
    });

    return NextResponse.json({
      message: 'Curso removido de la comunidad exitosamente',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Error removing course from community:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
