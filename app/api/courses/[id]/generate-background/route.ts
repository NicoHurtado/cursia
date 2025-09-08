import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { simpleAI } from '@/lib/ai/simple';
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

    // Verify the course belongs to the user
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course has metadata
    if (!course.title || !course.description) {
      return NextResponse.json(
        { error: 'Course metadata not ready' },
        { status: 400 }
      );
    }

    // Get existing modules with their chunks
    const existingModules = await db.module.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        chunks: true,
      },
      orderBy: {
        moduleOrder: 'asc',
      },
    });

    // Find modules that don't have chunks (need content generation)
    const modulesToGenerate = existingModules.filter(
      module => module.chunks.length === 0
    );

    // Parse module list once at the beginning
    const moduleList = JSON.parse(course.moduleList);

    // If all modules already have content, just return success
    if (modulesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All modules already have content',
        modulesGenerated: existingModules.length,
      });
    }

    // Generate content for remaining modules in background
    // Sort modules to prioritize by order
    const sortedModulesToGenerate = modulesToGenerate.sort(
      (a, b) => a.moduleOrder - b.moduleOrder
    );

    for (const module of sortedModulesToGenerate) {
      const moduleTitle = moduleList[module.moduleOrder - 1];
      const moduleOrder = module.moduleOrder;

      try {
        // Log generation start
        await db.generationLog.create({
          data: {
            courseId: course.id,
            action: `module${moduleOrder}_start`,
            message: `Starting module ${moduleOrder} generation`,
          },
        });

        const moduleContent = await simpleAI.generateModuleContent(
          course.title,
          moduleTitle,
          moduleOrder,
          course.totalModules,
          course.description
        );

        // Update module with generated content
        await db.module.update({
          where: { id: module.id },
          data: {
            title: moduleContent.title,
            description: moduleContent.description,
          },
        });

        // Create chunks
        for (let j = 0; j < moduleContent.chunks.length; j++) {
          const chunk = moduleContent.chunks[j];
          const chunkOrder = j + 1;

          // Search for video if this is the second chunk
          let videoData = null;
          if (chunkOrder === 2) {
            try {
              const { YouTubeService } = await import('@/lib/youtube');
              const video = await YouTubeService.findVideoForChunk(
                chunk.title,
                chunk.content,
                course.title || '',
                chunkOrder
              );
              if (video) {
                videoData = JSON.stringify(video);
              }
            } catch (error) {
              console.error('Error searching for video:', error);
              // Continue without video if search fails
            }
          }

          await db.chunk.create({
            data: {
              moduleId: module.id,
              chunkOrder: chunkOrder,
              title: chunk.title,
              content: chunk.content,
              videoData: videoData,
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
            action: `module${moduleOrder}_complete`,
            message: `Module ${moduleOrder} generation completed`,
          },
        });

        console.log(`✅ Module ${moduleOrder} generated successfully`);
      } catch (error) {
        console.error(`❌ Error generating module ${moduleOrder}:`, error);

        // Log error
        await db.generationLog.create({
          data: {
            courseId: course.id,
            action: `module${moduleOrder}_error`,
            message: `Module ${moduleOrder} generation failed: ${error}`,
          },
        });

        // Continue with next module instead of failing completely
        continue;
      }
    }

    // Update course status to complete
    await db.course.update({
      where: { id: courseId },
      data: { status: 'COMPLETE' },
    });

    return NextResponse.json({
      success: true,
      message: 'Background generation completed',
      modulesGenerated: course.totalModules,
    });
  } catch (error) {
    console.error('Background generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
