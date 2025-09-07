'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  AlertCircle,
  Star,
  PartyPopper,
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  questionOrder: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

interface ModuleQuizProps {
  quiz: QuizData;
  onQuizComplete: (passed: boolean, score: number) => void;
  onRetry: () => void;
  onContinue: () => void;
}

type QuizState = 'not-started' | 'in-progress' | 'completed';
type QuizResult = {
  passed: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  details: Array<{
    questionId: string;
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation?: string;
  }>;
};

export function ModuleQuiz({
  quiz,
  onQuizComplete,
  onRetry,
  onContinue,
}: ModuleQuizProps) {
  const [state, setState] = useState<QuizState>('not-started');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    new Array(quiz.questions.length).fill(-1)
  );
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: quiz.id,
          answers: answers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Quiz result data:', data);
        console.log('First question details:', data.details[0]);
        setResult(data);

        if (data.passed) {
          // Show celebration animation for 3 seconds, then continue
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setState('completed');
            onQuizComplete(data.passed, data.score);
          }, 3000);
        } else {
          setState('completed');
          onQuizComplete(data.passed, data.score);
        }
      } else {
        console.error('Quiz submission failed:', data.error);
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setState('not-started');
    setCurrentQuestion(0);
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setResult(null);
    onRetry();
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const currentQuestionData = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const allQuestionsAnswered = answers.every(answer => answer !== -1);

  // Celebration animation component
  if (showCelebration && result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md mx-4 text-center relative overflow-hidden">
          {/* Confetti animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Trophy className="h-12 w-12 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4 animate-bounce">
              ¡Felicitaciones! 🎉
            </h2>

            <div className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {result.score}%
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              ¡Has aprobado el quiz! 🎊
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-6 w-6 text-yellow-400 fill-current animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Preparando el siguiente módulo...
            </p>

            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'not-started') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">
              Module Quiz
            </CardTitle>
            <p className="text-muted-foreground">
              Test your knowledge with {quiz.questions.length} questions
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{quiz.title}</h3>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {quiz.questions.length} questions
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  50% to pass
                </span>
              </div>
            </div>

            <Button
              onClick={() => setState('in-progress')}
              size="lg"
              className="px-8"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'completed' && result) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {result.passed ? (
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            <CardTitle
              className={`text-3xl font-bold mb-2 ${
                result.passed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {result.passed ? '¡Quiz Aprobado!' : 'Quiz No Aprobado'}
            </CardTitle>

            <div className="text-4xl font-bold mb-2">{result.score}%</div>
            <p className="text-muted-foreground text-lg">
              {result.correctAnswers} de {result.totalQuestions} preguntas
              correctas
            </p>

            <div
              className={`mt-4 p-4 rounded-lg border-l-4 ${
                result.passed
                  ? 'bg-green-50 border-green-400 dark:bg-green-950/20'
                  : 'bg-orange-50 border-orange-400 dark:bg-orange-950/20'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  result.passed
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-orange-800 dark:text-orange-200'
                }`}
              >
                {result.passed
                  ? '🎉 ¡Felicitaciones! Has aprobado el quiz y puedes continuar al siguiente módulo.'
                  : '📚 No has alcanzado el 50% requerido. Puedes intentar el quiz nuevamente para mejorar tu puntuación.'}
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-center">
                📋 Revisión de Respuestas
              </h3>
            </div>

            <div className="space-y-6 mb-8">
              {result.details.map((detail, index) => (
                <div
                  key={detail.questionId}
                  className={`border-2 rounded-lg p-6 ${
                    detail.isCorrect
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/10'
                      : 'border-red-200 bg-red-50 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {detail.isCorrect ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant={detail.isCorrect ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          Pregunta {index + 1}
                        </Badge>
                        <Badge
                          variant={detail.isCorrect ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {detail.isCorrect ? 'Correcta' : 'Incorrecta'}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-lg mb-4">
                        {detail.question}
                      </h4>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            Tu respuesta:
                          </span>
                          <div
                            className={`p-4 rounded-lg border-l-4 ${
                              detail.isCorrect
                                ? 'bg-green-50 border-green-400 dark:bg-green-950/20'
                                : 'bg-red-50 border-red-400 dark:bg-red-950/20'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded ${
                                    detail.isCorrect
                                      ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                                      : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                  }`}
                                >
                                  {detail.userAnswer >= 0
                                    ? `Opción ${detail.userAnswer + 1}`
                                    : 'Sin responder'}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                                {detail.userAnswer >= 0
                                  ? detail.options[detail.userAnswer]
                                  : 'No seleccionaste ninguna opción'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {detail.explanation && (
                          <div className="space-y-2">
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                              💡 Explicación:
                            </span>
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                {detail.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              {result.passed ? (
                <Button
                  onClick={onContinue}
                  size="lg"
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Continuar al Siguiente Módulo
                </Button>
              ) : (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Intentar Quiz Nuevamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </CardTitle>
            <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
          </div>

          <Progress value={progress} className="mb-4" />
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {currentQuestionData.question}
            </h3>

            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    answers[currentQuestion] === index
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion] === index
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {answers[currentQuestion] === index && (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span className="font-medium">Option {index + 1}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{option}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={answers[currentQuestion] === -1}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
