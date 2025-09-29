import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId, answers } = await request.json();

    if (!moduleId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'moduleId and answers array are required' },
        { status: 400 }
      );
    }

    // Get the module and verify it belongs to a course owned by the user
    const module = await db.module.findFirst({
      where: {
        id: moduleId,
        course: {
          userId: session.user.id,
        },
      },
      include: {
        course: true,
        quizzes: {
          include: {
            questions: {
              orderBy: {
                questionOrder: 'asc',
              },
            },
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get the quiz for this module
    const quiz = module.quizzes[0]; // Assuming one quiz per module
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Calculate score
    let correctAnswers = 0;
    const questionResults = [];

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      const userAnswer = answers[i];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctAnswers++;
      }

      // Parse options safely
      let parsedOptions;
      try {
        parsedOptions = JSON.parse(question.options);
      } catch (error) {
        console.error('Error parsing question options:', error);
        parsedOptions = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4']; // Fallback
      }

      questionResults.push({
        questionId: question.id,
        question: question.question,
        options: parsedOptions,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    }

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= 50; // 50% or higher to pass

    // Get or create user progress
    let userProgress = await db.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: module.courseId,
        },
      },
    });

    if (!userProgress) {
      return NextResponse.json(
        { error: 'Course must be started before taking quizzes' },
        { status: 400 }
      );
    }

    // Parse quiz attempts
    const quizAttempts = JSON.parse(userProgress.quizAttempts);

    // Add new attempt
    const attempt = {
      moduleId,
      quizId: quiz.id,
      answers,
      score,
      passed,
      attemptedAt: new Date().toISOString(),
    };

    quizAttempts.push(attempt);

    // If passed, add module to completed modules
    let completedModules = JSON.parse(userProgress.completedModules);
    if (passed && !completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    }

    // Update user progress
    await db.userProgress.update({
      where: {
        id: userProgress.id,
      },
      data: {
        quizAttempts: JSON.stringify(quizAttempts),
        completedModules: JSON.stringify(completedModules),
      },
    });

    return NextResponse.json({
      passed,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      details: questionResults,
    });
  } catch (error) {
    console.error('Quiz attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
