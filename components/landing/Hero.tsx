'use client';

import { useState, useEffect } from 'react';

import { SimpleCourseMockup } from './SimpleCourseMockup';
import { Badge } from '@/components/ui/badge';

type GenerationState =
  | 'idle'
  | 'typing'
  | 'thinking'
  | 'generating'
  | 'complete';

export function Hero() {
  const [state, setState] = useState<GenerationState>('idle');
  const [typedPrompt, setTypedPrompt] = useState('');
  const [showCourse, setShowCourse] = useState(false);
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [isFirstAnimationComplete, setIsFirstAnimationComplete] =
    useState(false);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [showCourseView, setShowCourseView] = useState(false);

  const demos = [
    {
      prompt: 'UX Writing para marketing digital',
      course: {
        title: 'UX Writing para marketing digital',
        description:
          'Este curso completo de UX Writing para marketing digital está diseñado para nivel intermedio. Aprenderás los conceptos fundamentales y técnicas avanzadas de manera estructurada y progresiva. El curso incluye múltiples módulos que te guiarán desde los conceptos básicos hasta la aplicación práctica en proyectos reales. Perfecto para desarrollar habilidades profesionales y aplicar conocimientos en situaciones del mundo real.',
        level: 'Intermedio',
        language: 'Español',
        modules: 5,
        author: 'María García',
        progress: 80,
        duration: '8 horas',
        completedModules: 4,
        quizzes: 3,
        passedQuizzes: 2,
        completionDate: 'Completado el 15 de Diciembre, 2024',
      },
      color: '#8b5cf6',
    },
    {
      prompt: 'Fundamentos de Kubernetes para backend',
      course: {
        title: 'Fundamentos de Kubernetes para backend',
        description:
          'Este curso completo de fundamentos de Kubernetes para backend está diseñado para nivel avanzado. Aprenderás los conceptos fundamentales y técnicas avanzadas de manera estructurada y progresiva. El curso incluye múltiples módulos que te guiarán desde los conceptos básicos hasta la aplicación práctica en proyectos reales. Perfecto para desarrollar habilidades profesionales y aplicar conocimientos en situaciones del mundo real.',
        level: 'Avanzado',
        language: 'Español',
        modules: 5,
        author: 'Carlos Rodríguez',
        progress: 60,
        duration: '12 horas',
        completedModules: 3,
        quizzes: 2,
        passedQuizzes: 1,
        completionDate: 'Completado el 18 de Diciembre, 2024',
      },
      color: '#059669',
    },
    {
      prompt: 'Python desde cero en 7 días',
      course: {
        title: 'Python desde cero en 7 días',
        description:
          'Este curso completo de Python desde cero en 7 días está diseñado para nivel principiante. Aprenderás los conceptos fundamentales y técnicas avanzadas de manera estructurada y progresiva. El curso incluye múltiples módulos que te guiarán desde los conceptos básicos hasta la aplicación práctica en proyectos reales. Perfecto para desarrollar habilidades profesionales y aplicar conocimientos en situaciones del mundo real.',
        level: 'Principiante',
        language: 'Español',
        modules: 7,
        author: 'Ana Martínez',
        progress: 45,
        duration: '14 horas',
        completedModules: 3,
        quizzes: 4,
        passedQuizzes: 2,
      },
      color: '#3b82f6',
    },
  ];

  const currentDemo = demos[currentDemoIndex];

  // Auto-start the demo after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setState('typing');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state === 'typing') {
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex < currentDemo.prompt.length) {
          setTypedPrompt(currentDemo.prompt.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setState('thinking'), 500);
        }
      }, 100);

      return () => clearInterval(typeInterval);
    }
  }, [state, currentDemo.prompt]);

  useEffect(() => {
    if (state === 'thinking') {
      const thinkingTimer = setTimeout(() => {
        setState('generating');
      }, 2000);

      return () => clearTimeout(thinkingTimer);
    }
  }, [state]);

  useEffect(() => {
    if (state === 'generating') {
      const generatingTimer = setTimeout(() => {
        setShowCourse(true);
        setState('complete');
        setIsFirstAnimationComplete(true);
      }, 1500);

      return () => clearTimeout(generatingTimer);
    }
  }, [state]);

  // Toggle between intro and course view
  useEffect(() => {
    if (showCourse && isFirstAnimationComplete) {
      const toggleTimer = setTimeout(() => {
        setShowCourseView(!showCourseView);
      }, 4000);

      return () => clearTimeout(toggleTimer);
    }
  }, [showCourse, isFirstAnimationComplete, showCourseView]);

  // Handle first animation completion and start carousel
  useEffect(() => {
    if (state === 'complete' && !isFirstAnimationComplete) {
      const firstCompleteTimer = setTimeout(() => {
        setIsFirstAnimationComplete(true);
        setState('idle');
        setTypedPrompt('');
        setShowCourse(false);

        // Start carousel after first animation
        setTimeout(() => {
          startCarousel();
        }, 2000);
      }, 3000); // Show first completed state for 3 seconds

      return () => clearTimeout(firstCompleteTimer);
    }
  }, [state, isFirstAnimationComplete]);

  // Carousel logic
  const startCarousel = () => {
    const carouselInterval = setInterval(() => {
      setCurrentDemoIndex(prev => {
        const nextIndex = (prev + 1) % demos.length;
        setCarouselOffset(-nextIndex * 100); // Move carousel
        return nextIndex;
      });
    }, 4000); // Change every 4 seconds

    // Store interval ID for cleanup
    return carouselInterval;
  };

  // Start carousel after first animation
  useEffect(() => {
    if (isFirstAnimationComplete) {
      const interval = startCarousel();
      return () => clearInterval(interval);
    }
  }, [isFirstAnimationComplete]);

  return (
    <section className="relative py-20 md:py-32">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-4 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
          >
            Generación de cursos con IA
          </Badge>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-tight">
            Genera cursos completos con{' '}
            <span className="text-primary">IA en segundos</span>
          </h1>

          {/* Subcopy */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-[720px] mx-auto leading-relaxed">
            Escribe tu prompt. <span className="text-foreground">Curs</span>
            <span className="text-blue-600">ia</span> crea tu curso.
          </p>

          {/* Animated Prompt Display */}
          <div className="pt-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.25)]">
                <div className="text-lg font-medium min-h-[1.5rem] leading-relaxed">
                  {!isFirstAnimationComplete ? (
                    // Show typing animation for first demo
                    <>
                      {typedPrompt}
                      {state === 'typing' && (
                        <span className="animate-blink text-primary text-xl">
                          |
                        </span>
                      )}
                    </>
                  ) : (
                    // Show current demo prompt in carousel mode
                    <div className="relative overflow-hidden">
                      <div
                        className="flex transition-transform duration-1000 ease-in-out"
                        style={{ transform: `translateX(${carouselOffset}%)` }}
                      >
                        {demos.map((demo, index) => (
                          <div key={index} className="w-full flex-shrink-0">
                            {demo.prompt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thinking State */}
          {state === 'thinking' && (
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center space-x-3 text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-sm">
                  Pensando en la estructura del curso...
                </span>
              </div>
            </div>
          )}

          {/* Generating State */}
          {state === 'generating' && (
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center space-x-3 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">
                  Generando módulos, quizzes y certificado...
                </span>
              </div>
            </div>
          )}

          {/* Course Mockup - First Animation or Carousel */}
          {!isFirstAnimationComplete ? (
            // First animation sequence
            <div
              className={`transition-all duration-700 ease-out ${showCourse ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-98'}`}
            >
              {showCourse && (
                <div
                  className="animate-fade-in-up"
                  style={{
                    animationDuration: '600ms',
                    animationTimingFunction: 'ease-out',
                  }}
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        ¡Curso generado exitosamente!
                      </span>
                    </div>
                  </div>
                  <SimpleCourseMockup course={currentDemo.course} />
                </div>
              )}
            </div>
          ) : (
            // Carousel mode
            <div className="w-full">
              {/* Carousel container */}
              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-1000 ease-in-out"
                  style={{ transform: `translateX(${carouselOffset}%)` }}
                >
                  {demos.map((demo, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">
                            ¡Curso generado exitosamente!
                          </span>
                        </div>
                      </div>
                      <SimpleCourseMockup course={demo.course} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Additional CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <p className="text-sm text-muted-foreground">
              Gratis para empezar • Sin tarjeta de crédito
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
