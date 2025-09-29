import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Verificar que el curso pertenece al usuario
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Obtener todos los módulos del curso
    const modules = await db.module.findMany({
      where: { courseId },
      orderBy: { moduleOrder: 'asc' },
      include: {
        chunks: {
          orderBy: { chunkOrder: 'asc' },
        },
        quizzes: {
          include: {
            questions: true,
          },
        },
      },
    });

    // Calcular el estado de generación de cada módulo
    const moduleStatus = modules.map(module => {
      const hasContent = module.chunks.length > 0;
      const hasQuiz =
        module.quizzes.length > 0 && module.quizzes[0].questions.length > 0;
      const isComplete = hasContent && hasQuiz;

      return {
        moduleOrder: module.moduleOrder,
        title: module.title,
        hasContent,
        hasQuiz,
        isComplete,
        chunksCount: module.chunks.length,
        quizQuestionsCount:
          module.quizzes.length > 0 ? module.quizzes[0].questions.length : 0,
      };
    });

    // Calcular progreso general
    const totalModules = modules.length;
    const completedModules = moduleStatus.filter(m => m.isComplete).length;
    const progressPercentage =
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

    return NextResponse.json({
      courseId,
      totalModules,
      completedModules,
      progressPercentage,
      modules: moduleStatus,
      isFullyGenerated: completedModules === totalModules,
    });
  } catch (error) {
    console.error('Error checking generation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
