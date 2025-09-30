import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { simpleAI } from '@/lib/ai/simple';
import { YouTubeService } from '@/lib/youtube';

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting module regeneration for course ${courseId}`);

    // Get course
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            chunks: true,
          },
          orderBy: { moduleOrder: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const moduleList = JSON.parse(course.moduleList || '[]');
    const results = [];

    // Find modules that need content generation (no chunks)
    const modulesToGenerate = course.modules.filter(
      module => module.chunks.length === 0 && module.moduleOrder > 1
    );

    console.log(`🔍 Found ${modulesToGenerate.length} modules to regenerate`);

    if (modulesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All modules already have content',
        courseId: course.id,
        courseTitle: course.title,
        modulesGenerated: 0,
        totalModules: course.modules.length,
      });
    }

    // Update course status to generating remaining
    await db.course.update({
      where: { id: courseId },
      data: { status: 'GENERATING_REMAINING' },
    });

    // Generate content for each module
    for (const module of modulesToGenerate) {
      const moduleTitle = moduleList[module.moduleOrder - 1];
      const moduleOrder = module.moduleOrder;

      try {
        console.log(`🔄 Regenerating module ${moduleOrder}: ${moduleTitle}`);

        // Generate module content
        const moduleContentJson = await simpleAI.generateModuleContent(
          course.title || 'Curso',
          moduleTitle,
          moduleOrder,
          course.totalModules,
          course.description || ''
        );

        const moduleContent = JSON.parse(moduleContentJson);

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
              const video = await YouTubeService.findVideoForChunk(
                chunk.title,
                chunk.content,
                course.title || 'Curso',
                chunkOrder
              );
              if (video) {
                videoData = JSON.stringify(video);
                console.log(`✅ Video found for chunk: ${chunk.title}`);
              } else {
                console.log(`⚠️ No video found for chunk: ${chunk.title}`);
              }
            } catch (error) {
              console.error('Error searching for video:', error);
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

        results.push({
          moduleOrder,
          moduleTitle,
          status: 'success',
          chunksCreated: moduleContent.chunks.length,
          videoFound: moduleContent.chunks.length >= 2,
        });

        console.log(`✅ Module ${moduleOrder} regenerated successfully`);
      } catch (error) {
        console.error(`❌ Error regenerating module ${moduleOrder}:`, error);
        results.push({
          moduleOrder,
          moduleTitle,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update course status to ready (all modules generated)
    await db.course.update({
      where: { id: courseId },
      data: { status: 'READY' },
    });

    return NextResponse.json({
      success: true,
      courseId: course.id,
      courseTitle: course.title,
      modulesGenerated: results.filter(r => r.status === 'success').length,
      totalModules: modulesToGenerate.length,
      results,
    });
  } catch (error) {
    console.error('Regenerate modules error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



