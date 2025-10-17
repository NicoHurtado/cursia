'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { ChunkReader } from './ChunkReader';
import { CourseIntro } from './CourseIntro';
import { CourseLoadingScreenWithGame } from './CourseLoadingScreenWithGame';
import { FinishCourse } from './FinishCourse';
import { ModuleQuiz } from './ModuleQuiz';
import { ModuleSidebar } from './ModuleSidebar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NormalLoadingScreen } from '@/components/ui/normal-loading-screen';
import { useToast } from '@/components/ui/use-toast';
import { CourseFullResponse } from '@/lib/dto/course';

const isDev = process.env.NODE_ENV !== 'production';

interface CourseShellProps {
  course: CourseFullResponse;
}

interface UserProgress {
  completedChunks: string[];
  completedModules: string[];
  moduleProgress: { [key: number]: number };
  completionPercentage: number;
  currentModuleId?: string | null;
  currentChunkId?: string | null;
  quizAttempts?: any[];
  userPlan?: string;
  allowedMaxModules?: number;
}

export function CourseShell({ course: initialCourse }: CourseShellProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Check if coming from dashboard
  const fromDashboard = searchParams.get('from') === 'dashboard';

  const [course, setCourse] = useState<CourseFullResponse>(initialCourse);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [courseStarted, setCourseStarted] = useState(false);
  const courseHasContent = course.modules.some(
    module => module.chunks.length > 0
  );
  const module1HasContent = (() => {
    const module1 = course.modules.find(m => m.moduleOrder === 1);
    return module1 ? module1.chunks.length > 0 : false;
  })();

  // Function to check if current module's quiz has been completed
  const isCurrentModuleQuizCompleted = () => {
    if (!userProgress?.quizAttempts || !currentModule) return false;

    const quizAttempts = userProgress.quizAttempts;
    return quizAttempts.some(
      (attempt: any) =>
        attempt.moduleId === currentModule.id && attempt.passed === true
    );
  };

  const [currentView, setCurrentView] = useState<
    'intro' | 'module' | 'quiz' | 'finish'
  >('intro');
  const [currentModuleOrder, setCurrentModuleOrder] = useState(1);
  const [currentChunkOrder, setCurrentChunkOrder] = useState(1);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [courseStatus, setCourseStatus] = useState<string>('loading');
  const [isModifying, setIsModifying] = useState(false);
  const [moduleGenerationStatus, setModuleGenerationStatus] =
    useState<any>(null);
  const [isCheckingGeneration, setIsCheckingGeneration] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // If the course is already READY on first render, enable READY mode to start polling
  useEffect(() => {
    if (course.status === 'READY' && courseStatus !== 'READY') {
      setCourseStatus('READY');
      // Kick an immediate status check to pull freshly generated modules/chunks
      checkModuleGenerationStatus().catch(() => {});
    }
  }, [course.status, courseStatus]);

  // Restaurar estado inmediatamente al montar el componente (solo si no viene del dashboard)
  useEffect(() => {
    if (fromDashboard) {
      if (isDev) console.log('🚀 Coming from dashboard, staying on intro view');
      return;
    }

    const savedState = restoreNavigationState();
    if (savedState && savedState.view !== 'intro') {
      console.log('🚀 IMMEDIATE RESTORATION on component mount:', savedState);
      setCurrentView(savedState.view as any);
      setCurrentModuleOrder(savedState.moduleOrder);
      setCurrentChunkOrder(savedState.chunkOrder);
    }
  }, [fromDashboard]); // Solo se ejecuta una vez al montar

  // Función para guardar el estado de navegación en localStorage
  const saveNavigationState = (
    view: string,
    moduleOrder: number,
    chunkOrder: number
  ) => {
    // No guardar el estado 'intro' ya que es el estado por defecto
    if (view === 'intro') {
      if (isDev) console.log('Skipping save for intro state');
      return;
    }

    const navigationState = {
      view,
      moduleOrder,
      chunkOrder,
      timestamp: Date.now(),
    };
    const key = `course-navigation-${course.id}`;
    if (isDev)
      console.log(
        '💾 Saving navigation state:',
        navigationState,
        'with key:',
        key
      );
    localStorage.setItem(key, JSON.stringify(navigationState));
  };

  // Función para restaurar el estado de navegación desde localStorage
  const restoreNavigationState = () => {
    try {
      const key = `course-navigation-${course.id}`;
      if (isDev) console.log('Looking for navigation state with key:', key);
      const saved = localStorage.getItem(key);
      if (isDev) console.log('Saved navigation state:', saved);

      if (saved) {
        const navigationState = JSON.parse(saved);
        if (isDev) console.log('Parsed navigation state:', navigationState);

        // Solo restaurar si el estado es reciente (menos de 24 horas)
        const isRecent =
          Date.now() - navigationState.timestamp < 24 * 60 * 60 * 1000;
        if (isDev)
          console.log(
            'Is recent?',
            isRecent,
            'Time difference:',
            Date.now() - navigationState.timestamp
          );

        if (
          isRecent &&
          navigationState.view &&
          navigationState.moduleOrder &&
          navigationState.chunkOrder
        ) {
          if (isDev) console.log('Navigation state is valid and recent');
          return navigationState;
        } else {
          if (isDev) console.log('Navigation state is not valid or not recent');
        }
      } else {
        if (isDev) console.log('No saved navigation state found');
      }
    } catch (error) {
      console.error('Error restoring navigation state:', error);
    }
    return null;
  };

  // Function to refresh user progress
  const refreshUserProgress = async () => {
    try {
      const response = await fetch(`/api/progress/${course.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const progressData = await response.json();
        setUserProgress(progressData);
      }
    } catch (error) {
      console.error('Error refreshing user progress:', error);
    }
  };

  // Function to check module generation status
  const checkModuleGenerationStatus = async () => {
    try {
      const response = await fetch(
        `/api/courses/${course.id}/generation-status`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const statusData = await response.json();
        setModuleGenerationStatus(statusData);
      }
    } catch (error) {
      console.error('Error checking module generation status:', error);
    }
  };

  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        console.log('Loading user progress for course:', course.id);

        const response = await fetch(`/api/progress/${course.id}`, {
          credentials: 'include',
        });
        if (isDev) console.log('Progress response status:', response.status);

        if (response.ok) {
          const progressData = await response.json();
          if (isDev) console.log('Progress data loaded:', progressData);
          setUserProgress(progressData);

          // Check if course is still being generated
          if (
            course.status === 'GENERATING_METADATA' ||
            course.status === 'METADATA_READY'
          ) {
            if (isDev)
              console.log(
                'Course is still being generated, status:',
                course.status
              );
            setIsGenerating(true);
            setCourseStatus(course.status);
          }

          if (progressData.currentModuleId) {
            const currentModule = course.modules.find(
              m => m.id === progressData.currentModuleId
            );
            if (currentModule) {
              if (isDev)
                console.log(
                  'Setting current module to:',
                  currentModule.moduleOrder
                );
              setCurrentModuleOrder(currentModule.moduleOrder);
            }
          }

          if (progressData.currentChunkId) {
            const currentModule = course.modules.find(
              m => m.id === progressData.currentModuleId
            );
            if (currentModule) {
              const currentChunk = currentModule.chunks.find(
                c => c.id === progressData.currentChunkId
              );
              if (currentChunk) {
                if (isDev)
                  console.log(
                    'Setting current chunk to:',
                    currentChunk.chunkOrder
                  );
                setCurrentChunkOrder(currentChunk.chunkOrder);
              }
            }
          }
        } else {
          if (isDev)
            console.log('Failed to load progress, status:', response.status);
          const errorData = await response.json();
          if (isDev) console.log('Error data:', errorData);

          if (isDev) console.log('Initializing with empty progress');
          setUserProgress({
            completedChunks: [],
            completedModules: [],
            moduleProgress: {},
            completionPercentage: 0,
            currentModuleId: null,
            currentChunkId: null,
          });
        }
      } catch (error) {
        console.error('Error loading user progress:', error);

        if (isDev) console.log('Initializing with empty progress due to error');
        setUserProgress({
          completedChunks: [],
          completedModules: [],
          moduleProgress: {},
          completionPercentage: 0,
          currentModuleId: null,
          currentChunkId: null,
        });
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadUserProgress();
  }, [course.id, course.modules]);

  // Restaurar estado de navegación después de cargar el progreso del usuario (solo si no viene del dashboard)
  useEffect(() => {
    if (fromDashboard) {
      if (isDev)
        console.log(
          '🚀 Coming from dashboard, skipping navigation restoration'
        );
      return;
    }

    if (userProgress && !isLoadingProgress) {
      if (isDev) console.log('=== NAVIGATION RESTORATION START ===');
      if (isDev) console.log('User progress loaded:', userProgress);

      const savedState = restoreNavigationState();
      if (isDev) console.log('Saved state from localStorage:', savedState);

      if (savedState && savedState.view !== 'intro') {
        if (isDev)
          console.log(
            'Attempting to restore saved navigation state:',
            savedState
          );

        // Validar que el módulo y lección existen
        const targetModule = course.modules.find(
          m => m.moduleOrder === savedState.moduleOrder
        );
        if (isDev) console.log('Target module found:', targetModule);

        if (
          targetModule &&
          savedState.chunkOrder <= targetModule.chunks.length
        ) {
          if (isDev) console.log('✅ Valid saved state, restoring...');
          setCurrentView(savedState.view as any);
          setCurrentModuleOrder(savedState.moduleOrder);
          setCurrentChunkOrder(savedState.chunkOrder);
          if (isDev) console.log('✅ Navigation state restored successfully');
          return; // Salir temprano para evitar sobrescribir
        } else {
          if (isDev)
            console.log('❌ Invalid saved state, falling back to progress');
        }
      }

      // Fallback: usar el progreso actual del usuario
      if (isDev) console.log('Using current user progress as fallback');
      if (userProgress.currentModuleId) {
        const currentModule = course.modules.find(
          m => m.id === userProgress.currentModuleId
        );
        if (isDev) console.log('Current module from progress:', currentModule);

        if (currentModule) {
          setCurrentModuleOrder(currentModule.moduleOrder);
          setCurrentView('module');

          if (userProgress.currentChunkId) {
            const currentChunk = currentModule.chunks.find(
              c => c.id === userProgress.currentChunkId
            );
            if (isDev)
              console.log('Current chunk from progress:', currentChunk);

            if (currentChunk) {
              setCurrentChunkOrder(currentChunk.chunkOrder);
            }
          }
          if (isDev) console.log('✅ Fallback navigation state set');
        }
      }
      if (isDev) console.log('=== NAVIGATION RESTORATION END ===');
    }
  }, [
    userProgress,
    isLoadingProgress,
    course.modules,
    course.id,
    fromDashboard,
  ]);

  // Poll module generation status every 5 seconds when course is being generated
  useEffect(() => {
    if (!courseStarted || courseStatus === 'READY') return;

    const interval = setInterval(() => {
      checkModuleGenerationStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [courseStarted, courseStatus]);

  // Función helper para cambiar vista y guardar estado
  const updateView = (
    view: 'intro' | 'module' | 'quiz' | 'finish',
    moduleOrder?: number,
    chunkOrder?: number
  ) => {
    if (isDev)
      console.log('🔄 updateView called:', { view, moduleOrder, chunkOrder });
    setCurrentView(view);
    if (moduleOrder !== undefined) setCurrentModuleOrder(moduleOrder);
    if (chunkOrder !== undefined) setCurrentChunkOrder(chunkOrder);
    if (isDev) console.log('✅ State updated successfully');
  };

  // Función para debuggear el estado actual
  const debugCurrentState = () => {
    const savedState = localStorage.getItem(`course-navigation-${course.id}`);
    if (isDev) {
      console.log('🔍 DEBUG CURRENT STATE:');
      console.log('  - currentView:', currentView);
      console.log('  - currentModuleOrder:', currentModuleOrder);
      console.log('  - currentChunkOrder:', currentChunkOrder);
      console.log('  - courseId:', course.id);
      console.log('  - savedState:', savedState);
      console.log('  - userProgress:', userProgress);
      console.log('  - isLoadingProgress:', isLoadingProgress);
    }
  };

  // Hacer la función de debug disponible globalmente para testing
  useEffect(() => {
    (window as any).debugCourseNavigation = debugCurrentState;
    return () => {
      delete (window as any).debugCourseNavigation;
    };
  }, [
    currentView,
    currentModuleOrder,
    currentChunkOrder,
    course.id,
    userProgress,
    isLoadingProgress,
  ]);

  // Guardar estado de navegación cuando cambie
  useEffect(() => {
    if (currentView && currentModuleOrder && currentChunkOrder) {
      saveNavigationState(currentView, currentModuleOrder, currentChunkOrder);
    }
  }, [currentView, currentModuleOrder, currentChunkOrder, course.id]);

  // Check if course is ready periodically when generating
  useEffect(() => {
    if (!isGenerating) return;

    const checkCourseStatus = async () => {
      try {
        const response = await fetch(`/api/courses/${course.id}`);
        if (response.ok) {
          const courseData = await response.json();
          const module1 = courseData.modules.find(
            (m: any) => m.moduleOrder === 1
          );

          if (module1 && module1.chunks.length > 0) {
            setIsGenerating(false);
            setCourseStatus('READY');
            // Reload progress to get updated data
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error checking course status:', error);
      }
    };

    const interval = setInterval(checkCourseStatus, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [isGenerating, course.id]);

  // Check module generation status periodically
  useEffect(() => {
    if (courseStatus !== 'READY') return;

    const checkModuleGeneration = async () => {
      if (isCheckingGeneration) return;

      try {
        setIsCheckingGeneration(true);
        const response = await fetch(
          `/api/courses/${course.id}/generation-status`
        );
        if (response.ok) {
          const status = await response.json();
          setModuleGenerationStatus(status);

          // Check if any new modules have been generated
          const hasNewContent = status.moduleStatus?.some(
            (moduleStatus: any) => {
              const currentModule = course.modules.find(
                (m: any) => m.moduleOrder === moduleStatus.moduleOrder
              );
              return (
                currentModule &&
                moduleStatus.isComplete &&
                currentModule.chunks.length === 0
              );
            }
          );

          // If new modules are available, reload the page to show the new content
          if (hasNewContent) {
            if (isDev)
              console.log(
                '✨ New modules generated! Reloading page to show new content...'
              );
            // Recargar la página automáticamente
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error checking module generation status:', error);
      } finally {
        setIsCheckingGeneration(false);
      }
    };

    // Check immediately
    checkModuleGeneration();

    // Then check every 3 seconds for faster updates
    const interval = setInterval(checkModuleGeneration, 3000);
    return () => clearInterval(interval);
  }, [courseStatus, course.id, isCheckingGeneration, course.modules]);

  const currentModule = course.modules.find(
    m => m.moduleOrder === currentModuleOrder
  );
  const currentQuiz = currentModule?.quizzes[0];

  const totalChunks = course.modules.reduce(
    (sum, module) => sum + module.chunks.length,
    0
  );

  const currentModuleCompleted =
    currentModule && userProgress
      ? currentModule.chunks.every(chunk =>
          userProgress.completedChunks.includes(chunk.id)
        )
      : false;

  const allModulesCompleted = userProgress
    ? course.modules.every(module => {
        const moduleChunkIds = module.chunks.map(chunk => chunk.id);
        const completedModuleChunks = userProgress.completedChunks.filter(id =>
          moduleChunkIds.includes(id)
        );
        return completedModuleChunks.length === module.chunks.length;
      })
    : false;

  const allQuizzesPassed = userProgress
    ? course.modules.every(module =>
        userProgress.completedModules.includes(module.id)
      )
    : false;

  const showFinishCourse = allModulesCompleted && allQuizzesPassed;

  // Función para verificar si un módulo está desbloqueado
  const isModuleUnlocked = (moduleOrder: number) => {
    // El módulo 1 siempre está desbloqueado
    if (moduleOrder === 1) return true;

    // Para módulos 2+, verificar que el módulo anterior esté completado (incluyendo quiz)
    const previousModule = course.modules.find(
      m => m.moduleOrder === moduleOrder - 1
    );
    if (!previousModule) return false;

    // Verificar si el módulo anterior está completado
    const previousModuleCompleted =
      userProgress?.completedModules.includes(previousModule.id) || false;

    // Verificar si el quiz del módulo anterior fue aprobado
    const previousModuleQuizPassed =
      userProgress?.quizAttempts?.some(
        (attempt: any) =>
          attempt.moduleId === previousModule.id && attempt.passed === true
      ) || false;

    return previousModuleCompleted && previousModuleQuizPassed;
  };

  const handleModuleChange = (moduleOrder: number) => {
    const targetModule = course.modules.find(
      m => m.moduleOrder === moduleOrder
    );
    if (!targetModule) return;

    // Client-side gating for trial plan (Plan de prueba): only modules 1 and 2
    if (
      userProgress?.userPlan === 'FREE' &&
      moduleOrder > (userProgress.allowedMaxModules || 2)
    ) {
      toast({
        title: 'Disponible en planes de pago',
        description:
          'El plan de prueba permite acceder solo a los primeros 2 módulos. Actualiza tu plan para continuar.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar si el módulo está desbloqueado
    if (!isModuleUnlocked(moduleOrder)) {
      toast({
        title: 'Módulo bloqueado',
        description:
          'Debes completar el módulo anterior y aprobar su quiz para desbloquear este módulo.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar si el módulo está generado
    const moduleGenStatus = moduleGenerationStatus?.moduleStatus?.find(
      (m: any) => m.moduleOrder === moduleOrder
    );
    const isModuleGenerated =
      moduleGenStatus?.isGenerated || targetModule.chunks.length > 0;

    if (isModuleGenerated) {
      setCurrentModuleOrder(moduleOrder);
      setCurrentChunkOrder(1);
    } else {
      toast({
        title: 'Módulo no disponible',
        description:
          'Este módulo aún se está generando. Por favor, espera un momento.',
        variant: 'destructive',
      });
    }
  };

  const handleChunkChange = (moduleOrder: number, chunkOrder: number) => {
    console.log('🔍 handleChunkChange called:', { moduleOrder, chunkOrder });

    // Client-side gating for trial plan
    if (
      userProgress?.userPlan === 'FREE' &&
      moduleOrder > (userProgress.allowedMaxModules || 2)
    ) {
      toast({
        title: 'Contenido bloqueado por tu plan',
        description:
          'El plan de prueba permite acceder solo a los primeros 2 módulos. Actualiza tu plan para continuar.',
        variant: 'destructive',
      });
      setShowUpgradeModal(true);
      return;
    }

    // Verificar si el módulo está desbloqueado
    if (!isModuleUnlocked(moduleOrder)) {
      toast({
        title: 'Módulo bloqueado',
        description:
          'Debes completar el módulo anterior y aprobar su quiz para acceder a este contenido.',
        variant: 'destructive',
      });
      return;
    }

    updateView('module', moduleOrder, chunkOrder);
  };

  const handlePreviousChunk = () => {
    if (currentModule) {
      const currentChunkIndex = currentModule.chunks.findIndex(
        chunk => chunk.chunkOrder === currentChunkOrder
      );
      if (currentChunkIndex > 0) {
        const previousChunk = currentModule.chunks[currentChunkIndex - 1];
        setCurrentChunkOrder(previousChunk.chunkOrder);
      }
    }
  };

  const handleNextChunk = async () => {
    if (currentModule) {
      const currentChunk = currentModule.chunks.find(
        chunk => chunk.chunkOrder === currentChunkOrder
      );
      const currentChunkIndex = currentModule.chunks.findIndex(
        chunk => chunk.chunkOrder === currentChunkOrder
      );

      // Mark current chunk as complete if not already completed
      if (
        currentChunk &&
        !userProgress?.completedChunks.includes(currentChunk.id)
      ) {
        await handleMarkChunkComplete(currentChunk.id);
      }

      // Move to next chunk if available
      if (currentChunkIndex < currentModule.chunks.length - 1) {
        const nextChunk = currentModule.chunks[currentChunkIndex + 1];
        setCurrentChunkOrder(nextChunk.chunkOrder);
      }
    }
  };

  useEffect(() => {
    if (!isLoadingProgress && currentModule) {
      const currentChunk = currentModule.chunks.find(
        chunk => chunk.chunkOrder === currentChunkOrder
      );
      if (currentChunk) {
        fetch(`/api/progress/${course.id}/mark-chunk-complete`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chunkId: currentChunk.id,
            updatePosition: true,
          }),
        }).catch(error => {
          console.error('Error updating position:', error);
        });
      }
    }
  }, [
    currentModuleOrder,
    currentChunkOrder,
    isLoadingProgress,
    course.id,
    currentModule,
  ]);

  const handleMarkChunkComplete = async (chunkId: string) => {
    setIsMarkingComplete(true);
    try {
      const response = await fetch(
        `/api/progress/${course.id}/mark-chunk-complete`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chunkId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserProgress(prev =>
          prev
            ? {
                ...prev,
                completedChunks: [...prev.completedChunks, chunkId],
                completionPercentage: data.completion_percentage,
                moduleProgress: data.module_progress,
              }
            : null
        );

        toast({
          title: '¡Lección completada!',
          description: 'Has marcado esta lección como completada.',
        });
      } else {
        if (response.status === 403) {
          try {
            const err = await response.json();
            if (err.upgradeRequired) {
              toast({
                title: 'Contenido bloqueado por tu plan',
                description:
                  err.error ||
                  'Tu plan de prueba permite solo los primeros 2 módulos.',
                variant: 'destructive',
              });
              setShowUpgradeModal(true);
              return;
            }
          } catch (_) {
            // ignore JSON parse error and fallthrough
          }
        }
        throw new Error('Failed to mark chunk complete');
      }
    } catch (error) {
      console.error('Error marking chunk complete:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la lección como completada.',
        variant: 'destructive',
      });
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleStartCourse = async () => {
    setIsStarting(true);
    try {
      if (userProgress && userProgress.completedChunks.length > 0) {
        updateView('module');
        toast({
          title: '¡Continuando curso!',
          description: `Continuando desde el Módulo ${currentModuleOrder}.`,
        });
      } else {
        const response = await fetch(`/api/courses/${course.id}/start`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setCourseStarted(true);
          updateView('module', 1, 1);
        } else if (response.status === 202) {
          // Course is still being generated
          const data = await response.json();
          setIsGenerating(true);
          toast({
            title: 'Generando contenido...',
            description:
              'El contenido del curso se está generando. Por favor, espera un momento e inténtalo de nuevo.',
            variant: 'default',
          });
        } else {
          throw new Error('Failed to start course');
        }
      }
    } catch (error) {
      console.error('Error starting course:', error);
      toast({
        title: 'Error',
        description:
          'No se pudo iniciar el curso. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleQuizComplete = async (passed: boolean, score: number) => {
    if (passed && currentModule) {
      setUserProgress(prev =>
        prev
          ? {
              ...prev,
              completedModules: [...prev.completedModules, currentModule.id],
            }
          : null
      );

      toast({
        title: '¡Quiz aprobado!',
        description: `¡Felicidades! Obtuviste ${score}% en el quiz.`,
      });

      // Refrescar el progreso del usuario para actualizar quizAttempts
      await refreshUserProgress();
    } else {
      toast({
        title: 'Quiz no aprobado',
        description: '¡No te preocupes! Puedes volver a intentar el quiz.',
        variant: 'destructive',
      });
    }
  };

  const handleContinueToNextModule = () => {
    const nextModuleOrder = currentModuleOrder + 1;
    if (nextModuleOrder <= course.totalModules) {
      updateView('module', nextModuleOrder, 1); // Ir a la primera lección del siguiente módulo
    } else {
      updateView('finish');
    }
  };

  const handleModifyCourse = async () => {
    setIsModifying(true);
    try {
      // Redirect to create course page with the current prompt
      router.push(
        `/dashboard/create-course?prompt=${encodeURIComponent(course.userPrompt || '')}`
      );
    } catch (error) {
      console.error('Error redirecting to modify course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo redirigir a la página de modificación.',
        variant: 'destructive',
      });
    } finally {
      setIsModifying(false);
    }
  };

  const handleQuizRetry = () => {
    updateView('quiz');
  };

  const handleTakeQuiz = () => {
    updateView('quiz');
  };

  const handleFinishCourse = async () => {
    try {
      // Finalize the course (this will also generate the certificate)
      const response = await fetch(`/api/courses/${course.id}/finalize`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Finalize course error response:', errorData);
        throw new Error(errorData.error || 'Failed to finalize course');
      }

      const data = await response.json();
      console.log('Course finalized successfully:', data);
      console.log('Certificate ID from response:', data.certificateId);

      // Validate the response data
      if (!data.user || !data.user.name) {
        console.warn(
          'User data is incomplete in finalize response:',
          data.user
        );
      }

      if (!data.certificateId) {
        console.error('Certificate ID is missing from response:', data);
        throw new Error('Certificate ID not received from server');
      }

      return {
        certificateId: data.certificateId,
        course: data.course,
        user: data.user,
        completedAt: data.completedAt,
      };
    } catch (error) {
      console.error('Error finalizing course:', error);
      toast({
        title: 'Error',
        description: `Failed to finalize course: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDownloadCertificate = () => {
    toast({
      title: 'Coming soon',
      description: 'Certificate download will be available soon.',
    });
  };

  // Show normal loading screen when just loading user progress
  if (isLoadingProgress || !userProgress) {
    return <NormalLoadingScreen message="Cargando tu progreso..." />;
  }

  // Show special loading screen only when course is actually being generated
  if (isGenerating) {
    return (
      <CourseLoadingScreenWithGame
        status={courseStatus}
        onCourseReady={() => setCourseStatus('READY')}
      />
    );
  }

  if (currentView === 'intro') {
    return (
      <CourseIntro
        title={course.title || 'Course'}
        description={course.description || ''}
        level={course.userLevel || 'BEGINNER'}
        language={course.language}
        totalModules={course.totalModules}
        topics={course.topics}
        prerequisites={course.prerequisites}
        totalSizeEstimate={course.totalSizeEstimate || ''}
        onStartCourse={handleStartCourse}
        isStarting={isStarting}
        modules={course.modules.map(module => ({
          title: module.title,
          description: module.description || '',
        }))}
        hasProgress={
          userProgress ? userProgress.completedChunks.length > 0 : false
        }
        createdBy={course.createdBy || undefined}
        userPrompt={course.userPrompt || undefined}
        onModifyCourse={handleModifyCourse}
        isModifying={isModifying}
      />
    );
  }

  if (currentView === 'finish') {
    return (
      <div className="min-h-screen bg-background">
        <FinishCourse
          courseTitle={course.title || 'Course'}
          totalModules={course.totalModules}
          completedModules={course.modules.length}
          totalChunks={totalChunks}
          completedChunks={userProgress.completedChunks.length}
          userName={session?.user?.name || 'Usuario'}
          courseId={course.id}
          courseModules={course.modules.map(module => ({
            title: module.title,
            description: module.description || '',
          }))}
          onFinishCourse={handleFinishCourse}
          onDownloadCertificate={handleDownloadCertificate}
          onGoBackToCourse={() => updateView('module')}
        />
      </div>
    );
  }

  if (currentView === 'quiz' && currentQuiz) {
    return (
      <div className="min-h-screen bg-background">
        <ModuleQuiz
          quiz={{
            id: currentModule?.id || '',
            title: currentQuiz.title,
            questions: currentQuiz.questions.map(q => ({
              ...q,
              explanation: q.explanation || '',
            })),
          }}
          onQuizComplete={handleQuizComplete}
          onRetry={handleQuizRetry}
          onContinue={handleContinueToNextModule}
          onGoBack={() => updateView('module')}
        />
      </div>
    );
  }

  if (currentModule) {
    const currentChunk = currentModule.chunks.find(
      chunk => chunk.chunkOrder === currentChunkOrder
    );

    return (
      <>
        <div className="h-screen bg-background flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <ModuleSidebar
              modules={course.modules.map(module => ({
                ...module,
                description: module.description || '',
              }))}
              currentModuleOrder={currentModuleOrder}
              currentChunkOrder={currentChunkOrder}
              completedChunks={userProgress.completedChunks}
              completedModules={userProgress.completedModules}
              quizAttempts={userProgress.quizAttempts || []}
              onModuleChange={handleModuleChange}
              onChunkChange={handleChunkChange}
              moduleGenerationStatus={moduleGenerationStatus}
              className="flex-shrink-0"
              width={sidebarWidth}
              onWidthChange={setSidebarWidth}
            />

            {/* Main Content Area - Centered and Wider with scroll on the right edge */}
            <div className="flex-1 flex justify-center overflow-y-auto">
              {/* Content Area - Wider and Centered */}
              <div className="w-full max-w-6xl p-6">
                {currentChunk ? (
                  <ChunkReader
                    chunk={currentChunk}
                    isCompleted={userProgress.completedChunks.includes(
                      currentChunk.id
                    )}
                    isMarkingComplete={isMarkingComplete}
                    onMarkComplete={handleMarkChunkComplete}
                    onPrevious={handlePreviousChunk}
                    onNext={handleNextChunk}
                    canGoPrevious={currentChunkOrder > 1}
                    canGoNext={currentChunkOrder < currentModule.chunks.length}
                    courseTopic={course.title || ''}
                    onTakeQuiz={() => updateView('quiz')}
                    showQuizButton={
                      currentChunkOrder === currentModule.chunks.length &&
                      currentModule.quizzes &&
                      currentModule.quizzes.length > 0
                    }
                    quizCompleted={isCurrentModuleQuizCompleted()}
                    showFinishCourseButton={
                      currentModuleOrder === course.modules.length &&
                      currentChunkOrder === currentModule.chunks.length &&
                      isCurrentModuleQuizCompleted() &&
                      currentView !== ('finish' as any)
                    }
                    onFinishCourse={() => updateView('finish')}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold mb-2">
                        Lección no encontrada
                      </h2>
                      <p className="text-muted-foreground">
                        Esta lección no está disponible aún.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Upgrade Modal for FREE plan gating */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Desbloquea todos los módulos</DialogTitle>
              <DialogDescription>
                Tu plan de prueba permite acceder solo a los módulos 1 y 2.
                Actualiza tu plan para continuar con el curso completo y obtener
                certificado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowUpgradeModal(false)}
              >
                Seguir explorando
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => router.push('/dashboard/plans')}
              >
                Ver planes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
        <p className="text-muted-foreground">Preparando el curso para ti.</p>
      </div>
    </div>
  );
}
