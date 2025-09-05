import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  CourseCreateRequest,
  CourseCreateRequestSchema,
  CourseCreateResponse,
  CourseMetadataSchema,
  ModuleContentSchema,
} from '@/lib/dto/course';
import { simpleAI } from '@/lib/ai/simple';
import { v4 as uuidv4 } from 'uuid';
import { UserPlan, canCreateCourse } from '@/lib/plans';

// Enhanced rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 requests per minute per user

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all courses for the user (excluding deleted ones) - Optimized query
    const courses = await db.course.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null, // Exclude deleted courses
      },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        totalModules: true,
        _count: {
          select: {
            modules: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc', // Use updatedAt for better performance
      },
      take: 50, // Limit to 50 courses for better performance
    });

    // Map courses to response format
    const response = courses.map(course => ({
      id: course.id,
      courseId: course.courseId,
      title: course.title || 'Generating...',
      description: course.description || 'Course description will appear here once generated.',
      status: course.status.toLowerCase(),
      status_display: course.status,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      completedAt: course.completedAt?.toISOString() || null,
      totalModules: course.totalModules,
      completedModules: course._count.modules,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Courses list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user plan and check course creation limits
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count courses created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const coursesThisMonth = await db.course.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
        },
        deletedAt: null,
      },
    });

    // Check if user can create more courses based on their plan
    if (!canCreateCourse(user.plan as UserPlan, coursesThisMonth)) {
      return NextResponse.json(
        {
          error: 'Límite de cursos alcanzado para tu plan actual.',
          plan: user.plan,
          coursesCreated: coursesThisMonth,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitAllowed = simpleAI.checkRateLimit(session.user.id);
    if (!rateLimitAllowed) {
      const rateLimitInfo = simpleAI.getRateLimitInfo(session.user.id);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before creating another course.',
          retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = CourseCreateRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          fieldErrors: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { prompt, level, interests } = validatedData.data;

    // Sanitize prompt (basic validation)
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum 2000 characters allowed.' },
        { status: 400 }
      );
    }

    // Generate course ID
    const courseId = `course-${uuidv4()}`;

    // Map Spanish level to English enum
    const levelMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      principiante: 'BEGINNER',
      intermedio: 'INTERMEDIATE',
      avanzado: 'ADVANCED',
    };

    // Create course in database
    const course = await db.course.create({
      data: {
        courseId,
        userId: session.user.id,
        userPrompt: prompt,
        userLevel: levelMap[level] || 'BEGINNER',
        userInterests: JSON.stringify(interests),
        status: 'GENERATING_METADATA',
      },
    });

    // Log generation start
    await db.generationLog.create({
      data: {
        courseId: course.id, // Use the actual course ID, not the courseId string
        action: 'metadata_start',
        message: 'Starting metadata generation',
      },
    });

    try {
      // Generate metadata with simple AI system
      const metadata = await simpleAI.generateCourseMetadata(
        prompt,
        level,
        interests
      );

      // Update course with metadata
      await db.course.update({
        where: { courseId },
        data: {
          status: 'METADATA_READY',
          title: metadata.title,
          description: metadata.description,
          prerequisites: JSON.stringify(metadata.prerequisites),
          totalModules: metadata.totalModules,
          moduleList: JSON.stringify(metadata.moduleList),
          topics: JSON.stringify(metadata.topics),
          introduction: metadata.introduction,
          finalProjectData: metadata.finalProjectData
            ? JSON.stringify(metadata.finalProjectData)
            : null,
          totalSizeEstimate: metadata.totalSizeEstimate,
          language: metadata.language,
        },
      });

      // Log metadata completion
      await db.generationLog.create({
        data: {
          courseId: course.id,
          action: 'metadata_complete',
          message: 'Metadata generation completed',
        },
      });

      // Generate Module 1
      await db.generationLog.create({
        data: {
          courseId: course.id,
          action: 'module1_start',
          message: 'Starting module 1 generation',
        },
      });

      const moduleList = metadata.moduleList;
      const moduleTitle = moduleList[0]; // First module

      if (moduleTitle) {
        const moduleContent = await simpleAI.generateModuleContent(
          metadata.title,
          moduleTitle,
          1,
          metadata.totalModules,
          metadata.description
        );

        // Create module 1 with full content
        const module = await db.module.create({
          data: {
            courseId: course.id,
            moduleOrder: 1,
            title: moduleContent.title,
            description: moduleContent.description,
          },
        });

        // Create chunks for module 1
        for (let i = 0; i < moduleContent.chunks.length; i++) {
          const chunk = moduleContent.chunks[i];
          const chunkOrder = i + 1;
          
          // Search for video if this is the second chunk
          let videoData = null;
          if (chunkOrder === 2) {
            try {
              const { YouTubeService } = await import('@/lib/youtube');
              const video = await YouTubeService.findVideoForChunk(
                chunk.title,
                chunk.content,
                metadata.title,
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

        // Create quiz for module 1
        const quiz = await db.quiz.create({
          data: {
            moduleId: module.id,
            quizOrder: 1,
            title: moduleContent.quiz.title,
          },
        });

        // Create quiz questions for module 1
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

        // Create remaining modules with only title and description
        for (let i = 1; i < metadata.totalModules; i++) {
          const moduleTitle = moduleList[i];
          if (moduleTitle) {
            await db.module.create({
              data: {
                courseId: course.id,
                moduleOrder: i + 1,
                title: moduleTitle,
                description: `Módulo ${i + 1}: ${moduleTitle} - Contenido detallado se generará al iniciar el curso.`,
              },
            });
          }
        }

        // Update course status to ready
        await db.course.update({
          where: { courseId },
          data: { status: 'READY' },
        });

        // Log module 1 completion
        await db.generationLog.create({
          data: {
            courseId: course.id,
            action: 'module1_complete',
            message: 'Module 1 generation completed',
          },
        });
      }

      // Return response
      const response: CourseCreateResponse = {
        id: course.id,
        status: 'ready',
        title: metadata.title,
        message: 'Curso creado exitosamente con metadata y módulo 1 listos!',
      };

      return NextResponse.json(response);
    } catch (error) {
      // Log error and update status
      await db.generationLog.create({
        data: {
          courseId: course.id,
          action: 'generation_error',
          message: `Generation failed: ${error}`,
        },
      });

      await db.course.update({
        where: { courseId },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Course generation failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
