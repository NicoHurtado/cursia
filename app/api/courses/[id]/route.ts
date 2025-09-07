import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { CourseFullResponse } from '@/lib/dto/course';

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

    // Get course with all related data
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      include: {
        modules: {
          include: {
            chunks: {
              orderBy: { chunkOrder: 'asc' },
            },
            videos: {
              orderBy: { videoOrder: 'asc' },
            },
            quizzes: {
              include: {
                questions: {
                  orderBy: { questionOrder: 'asc' },
                },
              },
              orderBy: { quizOrder: 'asc' },
            },
          },
          orderBy: { moduleOrder: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Map course data to response format
    const response: CourseFullResponse = {
      id: course.id,
      courseId: course.courseId,
      status: course.status.toLowerCase(),
      status_display: course.status,
      progress_percentage: 0, // Will be calculated by status endpoint
      title: course.title,
      description: course.description,
      userPrompt: course.userPrompt,
      createdBy: session.user.name || session.user.email || session.user.id,
      prerequisites: JSON.parse(course.prerequisites),
      totalModules: course.totalModules,
      moduleList: JSON.parse(course.moduleList),
      topics: JSON.parse(course.topics),
      introduction: course.introduction,
      finalProjectData: course.finalProjectData
        ? JSON.parse(course.finalProjectData)
        : null,
      totalSizeEstimate: course.totalSizeEstimate,
      language: course.language,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      completedAt: course.completedAt?.toISOString() || null,
      modules: course.modules.map(module => ({
        id: module.id,
        moduleOrder: module.moduleOrder,
        title: module.title,
        description: module.description,
        chunks: module.chunks.map(chunk => ({
          id: chunk.id,
          chunkOrder: chunk.chunkOrder,
          title: chunk.title,
          content: chunk.content,
        })),
        videos: module.videos.map(video => ({
          id: video.id,
          videoOrder: video.videoOrder,
          title: video.title,
          description: video.description,
          duration: video.duration,
          url: video.url,
        })),
        quizzes: module.quizzes.map(quiz => ({
          id: quiz.id,
          quizOrder: quiz.quizOrder,
          title: quiz.title,
          questions: quiz.questions.map(question => ({
            id: question.id,
            questionOrder: question.questionOrder,
            question: question.question,
            options: JSON.parse(question.options),
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          })),
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
