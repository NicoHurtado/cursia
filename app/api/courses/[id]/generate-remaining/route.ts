import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { generateModuleContent } from '@/lib/ai/anthropic';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ModuleContentSchema } from '@/lib/dto/course';

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
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.status !== 'READY') {
      return NextResponse.json(
        {
          error: 'Course must be in READY status to generate remaining modules',
        },
        { status: 400 }
      );
    }

    // Update status to GENERATING_REMAINING
    await db.course.update({
      where: { id: courseId },
      data: { status: 'GENERATING_REMAINING' },
    });

    // Log start of remaining modules generation
    await db.generationLog.create({
      data: {
        courseId: course.id,
        action: 'remaining_modules_start',
        message: 'Starting generation of remaining modules',
      },
    });

    const moduleList = JSON.parse(course.moduleList);
    const totalModules = course.totalModules;

    // Generate modules 2 through totalModules
    for (let moduleOrder = 2; moduleOrder <= totalModules; moduleOrder++) {
      const moduleTitle = moduleList[moduleOrder - 1];

      if (moduleTitle) {
        try {
          // Log module generation start
          await db.generationLog.create({
            data: {
              courseId: course.id,
              action: `module_${moduleOrder}_start`,
              message: `Starting generation of module ${moduleOrder}`,
            },
          });

          // Generate module content
          const moduleContentJson = await generateModuleContent(
            course.title || 'Course',
            moduleTitle,
            moduleOrder,
            totalModules,
            course.description || ''
          );
          const moduleContent = ModuleContentSchema.parse(
            JSON.parse(moduleContentJson)
          );

          // Create module
          const module = await db.module.create({
            data: {
              courseId: course.id,
              moduleOrder,
              title: moduleContent.title,
              description: moduleContent.description,
            },
          });

          // Create chunks
          for (const [index, chunk] of moduleContent.chunks.entries()) {
            await db.chunk.create({
              data: {
                moduleId: module.id,
                chunkOrder: index + 1,
                title: chunk.title,
                content: chunk.content,
              },
            });
          }

          // Create quiz
          const quiz = await db.quiz.create({
            data: {
              moduleId: module.id,
              quizOrder: 1,
              title: moduleContent.quiz.title,
            },
          });

          // Create quiz questions
          for (const [
            index,
            question,
          ] of moduleContent.quiz.questions.entries()) {
            await db.quizQuestion.create({
              data: {
                quizId: quiz.id,
                questionOrder: index + 1,
                question: question.question,
                options: JSON.stringify(question.options),
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || null,
              },
            });
          }

          // Log module completion
          await db.generationLog.create({
            data: {
              courseId: course.id,
              action: `module_${moduleOrder}_complete`,
              message: `Module ${moduleOrder} generation completed`,
            },
          });
        } catch (error) {
          console.error(`Error generating module ${moduleOrder}:`, error);

          // Log error but continue with next module
          await db.generationLog.create({
            data: {
              courseId: course.id,
              action: `module_${moduleOrder}_error`,
              message: `Error generating module ${moduleOrder}: ${error}`,
            },
          });
        }
      }
    }

    // Update course status to COMPLETE
    await db.course.update({
      where: { id: courseId },
      data: {
        status: 'COMPLETE',
        completedAt: new Date(),
      },
    });

    // Log completion
    await db.generationLog.create({
      data: {
        courseId: course.id,
        action: 'remaining_modules_complete',
        message: 'All remaining modules generation completed',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Remaining modules generation started',
    });
  } catch (error) {
    console.error('Generate remaining modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
