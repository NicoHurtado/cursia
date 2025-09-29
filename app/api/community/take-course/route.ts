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

    // Verificar que el usuario tenga plan EXPERTO o MAESTRO para tomar cursos de comunidad
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (
      !user ||
      (user.plan !== UserPlan.EXPERTO && user.plan !== UserPlan.MAESTRO)
    ) {
      return NextResponse.json(
        {
          error:
            'Necesitas plan EXPERTO o MAESTRO para tomar cursos de la comunidad',
        },
        { status: 403 }
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'ID del curso requerido' },
        { status: 400 }
      );
    }

    // Verificar que el curso existe, es público y no es del mismo usuario
    const originalCourse = await db.course.findFirst({
      where: {
        id: courseId,
        isPublic: true,
        deletedAt: null,
        userId: { not: session.user.id }, // No puede tomar sus propios cursos
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        modules: {
          include: {
            chunks: true,
          },
          orderBy: {
            moduleOrder: 'asc',
          },
        },
      },
    });

    if (!originalCourse) {
      return NextResponse.json(
        { error: 'Curso no encontrado o no disponible para tomar' },
        { status: 404 }
      );
    }

    // Verificar que el usuario no haya tomado ya este curso
    const existingCourse = await db.course.findFirst({
      where: {
        userId: session.user.id,
        originalCourseId: courseId,
        deletedAt: null,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        {
          error: 'Ya has tomado este curso anteriormente',
          existingCourseId: existingCourse.id,
          redirect: true,
        },
        { status: 409 }
      );
    }

    // Generar un nuevo courseId único
    const newCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Clonar el curso
    const clonedCourse = await db.course.create({
      data: {
        courseId: newCourseId,
        title: originalCourse.title,
        description: originalCourse.description,
        status: 'READY',
        userId: session.user.id,
        userPrompt:
          originalCourse.userPrompt ||
          `Curso tomado de la comunidad: ${originalCourse.title}`,
        userLevel: originalCourse.userLevel,
        userInterests: originalCourse.userInterests || '[]',
        language: originalCourse.language,
        topics: originalCourse.topics,
        prerequisites: originalCourse.prerequisites,
        totalModules: originalCourse.totalModules,
        totalSizeEstimate: originalCourse.totalSizeEstimate,
        isPublic: false, // El curso clonado es privado para el usuario
        originalCourseId: courseId, // Referencia al curso original
        // Guardar información del autor original
        originalAuthorId: originalCourse.user.id,
        originalAuthorName: originalCourse.user.name,
        originalAuthorUsername: originalCourse.user.username,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Clonar todos los módulos
    for (const originalModule of originalCourse.modules) {
      const clonedModule = await db.module.create({
        data: {
          courseId: clonedCourse.id,
          title: originalModule.title,
          description: originalModule.description,
          moduleOrder: originalModule.moduleOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Clonar todos los chunks del módulo
      for (const originalChunk of originalModule.chunks) {
        await db.chunk.create({
          data: {
            moduleId: clonedModule.id,
            title: originalChunk.title,
            content: originalChunk.content,
            chunkOrder: originalChunk.chunkOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    // NO crear UserProgress aquí - solo se crea cuando el usuario haga clic en "Iniciar Curso"
    // Esto evita que los cursos de comunidad cuenten como "gastados" al tomarlos

    return NextResponse.json({
      message: 'Curso tomado exitosamente',
      course: {
        id: clonedCourse.id,
        courseId: clonedCourse.courseId,
        title: clonedCourse.title,
        description: clonedCourse.description,
        status: clonedCourse.status,
        totalModules: clonedCourse.totalModules,
        originalCourseId: clonedCourse.originalCourseId,
      },
    });
  } catch (error) {
    console.error('Error taking course:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
