'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CourseProgressBar } from './CourseProgressBar';
import { CourseIntro } from './CourseIntro';
import { ModuleQuiz } from './ModuleQuiz';
import { FinishCourse } from './FinishCourse';
import { ModuleSidebar } from './ModuleSidebar';
import { ChunkNavigator } from './ChunkNavigator';
import { ChunkReader } from './ChunkReader';
import { useToast } from '@/components/ui/use-toast';
import { CourseFullResponse } from '@/lib/dto/course';

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
}

export function CourseShell({ course }: CourseShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [courseStarted, setCourseStarted] = useState(false);
  const courseHasContent = course.modules.some(module => module.chunks.length > 0);
  const module1HasContent = course.modules.find(m => m.moduleOrder === 1)?.chunks.length > 0;
  
  const [currentView, setCurrentView] = useState<'intro' | 'module' | 'quiz' | 'finish'>('intro');
  const [currentModuleOrder, setCurrentModuleOrder] = useState(1);
  const [currentChunkOrder, setCurrentChunkOrder] = useState(1);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        console.log('Loading user progress for course:', course.id);
        const response = await fetch(`/api/progress/${course.id}`);
        console.log('Progress response status:', response.status);
        
        if (response.ok) {
          const progressData = await response.json();
          console.log('Progress data loaded:', progressData);
          setUserProgress(progressData);
          
          if (progressData.currentModuleId) {
            const currentModule = course.modules.find(m => m.id === progressData.currentModuleId);
            if (currentModule) {
              console.log('Setting current module to:', currentModule.moduleOrder);
              setCurrentModuleOrder(currentModule.moduleOrder);
            }
          }
          
          if (progressData.currentChunkId) {
            const currentModule = course.modules.find(m => m.id === progressData.currentModuleId);
            if (currentModule) {
              const currentChunk = currentModule.chunks.find(c => c.id === progressData.currentChunkId);
              if (currentChunk) {
                console.log('Setting current chunk to:', currentChunk.chunkOrder);
                setCurrentChunkOrder(currentChunk.chunkOrder);
              }
            }
          }
        } else {
          console.log('Failed to load progress, status:', response.status);
          const errorData = await response.json();
          console.log('Error data:', errorData);
          
          console.log('Initializing with empty progress');
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
        
        console.log('Initializing with empty progress due to error');
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

  useEffect(() => {
    if (module1HasContent && currentView === 'intro' && !isLoadingProgress && 
        (!userProgress || userProgress.completedChunks.length === 0)) {
      setCurrentView('module');
      setCourseStarted(true);
    }
  }, [module1HasContent, currentView, isLoadingProgress, userProgress]);

  const currentModule = course.modules.find(m => m.moduleOrder === currentModuleOrder);
  const currentQuiz = currentModule?.quizzes[0];

  const totalChunks = course.modules.reduce((sum, module) => sum + module.chunks.length, 0);

  const currentModuleCompleted = currentModule && userProgress ? 
    currentModule.chunks.every(chunk => userProgress.completedChunks.includes(chunk.id)) : false;

  const allModulesCompleted = userProgress ? course.modules.every(module => {
    const moduleChunkIds = module.chunks.map(chunk => chunk.id);
    const completedModuleChunks = userProgress.completedChunks.filter(id => 
      moduleChunkIds.includes(id)
    );
    return completedModuleChunks.length === module.chunks.length;
  }) : false;

  const allQuizzesPassed = userProgress ? course.modules.every(module => 
    userProgress.completedModules.includes(module.id)
  ) : false;

  const showFinishCourse = allModulesCompleted && allQuizzesPassed;

  const handleModuleChange = (moduleOrder: number) => {
    setCurrentModuleOrder(moduleOrder);
    setCurrentChunkOrder(1);
  };

  const handleChunkChange = (moduleOrder: number, chunkOrder: number) => {
    setCurrentModuleOrder(moduleOrder);
    setCurrentChunkOrder(chunkOrder);
  };

  useEffect(() => {
    if (!isLoadingProgress && currentModule) {
      const currentChunk = currentModule.chunks.find(chunk => chunk.chunkOrder === currentChunkOrder);
      if (currentChunk) {
        fetch(`/api/progress/${course.id}/mark-chunk-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            chunkId: currentChunk.id,
            updatePosition: true
          }),
        }).catch(error => {
          console.error('Error updating position:', error);
        });
      }
    }
  }, [currentModuleOrder, currentChunkOrder, isLoadingProgress, course.id, currentModule]);

  const handleMarkChunkComplete = async (chunkId: string) => {
    setIsMarkingComplete(true);
    try {
      const response = await fetch(`/api/progress/${course.id}/mark-chunk-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunkId }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProgress(prev => prev ? {
          ...prev,
          completedChunks: [...prev.completedChunks, chunkId],
          completionPercentage: data.completion_percentage,
          moduleProgress: data.module_progress,
        } : null);

        toast({
          title: '¡Lección completada!',
          description: 'Has marcado esta lección como completada.',
        });
      } else {
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
        setCurrentView('module');
        toast({
          title: '¡Continuando curso!',
          description: `Continuando desde el Módulo ${currentModuleOrder}.`,
        });
      } else {
        const response = await fetch(`/api/courses/${course.id}/start`, {
          method: 'POST',
        });

        if (response.ok) {
          setCourseStarted(true);
          setCurrentModuleOrder(1);
          setCurrentView('module');
          
          toast({
            title: '¡Curso iniciado!',
            description: 'Comenzando con el Módulo 1. Los módulos restantes se están generando en segundo plano.',
          });
        } else {
          throw new Error('Failed to start course');
        }
      }
    } catch (error) {
      console.error('Error starting course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el curso. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };


  const handleQuizComplete = (passed: boolean, score: number) => {
    if (passed && currentModule) {
      setUserProgress(prev => ({
        ...prev,
        completedModules: [...prev.completedModules, currentModule.id],
      }));
      
      toast({
        title: '¡Quiz aprobado!',
        description: `¡Felicidades! Obtuviste ${score}% en el quiz.`,
      });

      const nextModuleOrder = currentModuleOrder + 1;
      if (nextModuleOrder <= course.totalModules) {
        setCurrentModuleOrder(nextModuleOrder);
        setCurrentView('module');
      } else {
        setCurrentView('finish');
      }
    } else {
      toast({
        title: 'Quiz no aprobado',
        description: '¡No te preocupes! Puedes volver a intentar el quiz.',
        variant: 'destructive',
      });
    }
  };

  const handleQuizRetry = () => {
    setCurrentView('quiz');
  };

  const handleTakeQuiz = () => {
    setCurrentView('quiz');
  };

  const handleFinishCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${course.id}/finalize`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Course completed!',
          description: 'Congratulations on finishing the course!',
        });
      } else {
        throw new Error('Failed to finalize course');
      }
    } catch (error) {
      console.error('Error finalizing course:', error);
      toast({
        title: 'Error',
        description: 'Failed to finalize course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadCertificate = () => {
    toast({
      title: 'Coming soon',
      description: 'Certificate download will be available soon.',
    });
  };

  if (isLoadingProgress || !userProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando progreso...</p>
        </div>
      </div>
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
        totalSizeEstimate={course.totalSizeEstimate}
        onStartCourse={handleStartCourse}
        isStarting={isStarting}
        modules={course.modules.map(module => ({
          title: module.title,
          description: module.description
        }))}
        hasProgress={userProgress && userProgress.completedChunks.length > 0}
      />
    );
  }

  if (currentView === 'finish' || showFinishCourse) {
    return (
      <div className="min-h-screen bg-background">
        <CourseProgressBar
          completionPercentage={100}
          totalChunks={totalChunks}
          completedChunks={userProgress.completedChunks.length}
        />
        
        <FinishCourse
          courseTitle={course.title || 'Course'}
          totalModules={course.totalModules}
          completedModules={course.modules.length}
          totalChunks={totalChunks}
          completedChunks={userProgress.completedChunks.length}
          onFinishCourse={handleFinishCourse}
          onDownloadCertificate={handleDownloadCertificate}
        />
      </div>
    );
  }

  if (currentView === 'quiz' && currentQuiz) {
    return (
      <div className="min-h-screen bg-background">
        <CourseProgressBar
          completionPercentage={userProgress.completionPercentage}
          totalChunks={totalChunks}
          completedChunks={userProgress.completedChunks.length}
        />
        
        <ModuleQuiz
          quiz={{
            id: currentModule?.id || '',
            title: currentQuiz.title,
            questions: currentQuiz.questions,
          }}
          onQuizComplete={handleQuizComplete}
          onRetry={handleQuizRetry}
          onContinue={() => setCurrentView('module')}
        />
      </div>
    );
  }

  if (currentModule) {
    const currentChunk = currentModule.chunks.find(chunk => chunk.chunkOrder === currentChunkOrder);
    
    return (
      <div className="min-h-screen bg-background">
        <CourseProgressBar
          completionPercentage={userProgress.completionPercentage}
          totalChunks={totalChunks}
          completedChunks={userProgress.completedChunks.length}
        />
        
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar */}
          <ModuleSidebar
            modules={course.modules}
            currentModuleOrder={currentModuleOrder}
            currentChunkOrder={currentChunkOrder}
            completedChunks={userProgress.completedChunks}
            onModuleChange={handleModuleChange}
            onChunkChange={handleChunkChange}
            className="flex-shrink-0"
          />
          
          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentChunk ? (
                <ChunkReader 
                  chunk={currentChunk}
                  isCompleted={userProgress.completedChunks.includes(currentChunk.id)}
                  isMarkingComplete={isMarkingComplete}
                  onMarkComplete={handleMarkChunkComplete}
                  courseTopic={course.title || ''}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Lección no encontrada</h2>
                    <p className="text-muted-foreground">Esta lección no está disponible aún.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Sidebar - Chunk Navigator */}
            <div className="w-80 border-l border-border p-6 overflow-y-auto">
              <ChunkNavigator
                chunks={currentModule.chunks}
                currentChunkOrder={currentChunkOrder}
                completedChunks={userProgress.completedChunks}
                onChunkChange={(chunkOrder) => handleChunkChange(currentModuleOrder, chunkOrder)}
                onTakeQuiz={handleTakeQuiz}
                allChunksCompleted={currentModuleCompleted}
              />
            </div>
          </div>
        </div>
      </div>
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
