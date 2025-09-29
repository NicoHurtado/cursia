'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles, BookOpen, Target, Zap } from 'lucide-react';
import { MemoryGame } from '@/components/loading/MemoryGame';
import { CourseLoadingScreen } from '@/components/course/CourseLoadingScreen';
import { ContentBlockedDialog } from '@/components/content/ContentBlockedDialog';

const courseSchema = z.object({
  prompt: z
    .string()
    .min(10, 'El prompt debe tener al menos 10 caracteres')
    .max(2000, 'El prompt debe tener menos de 2000 caracteres'),
  level: z.enum(['principiante', 'intermedio', 'avanzado']),
});

type CourseForm = z.infer<typeof courseSchema>;

export default function CreateCoursePage() {
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [showContentBlocked, setShowContentBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [blockedCategory, setBlockedCategory] = useState<string | undefined>();
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  const [isCourseReady, setIsCourseReady] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
  });

  // Pre-fill prompt from URL parameters
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl) {
      setValue('prompt', decodeURIComponent(promptFromUrl));
      console.log('📝 Pre-filled prompt from URL:', promptFromUrl);
    }
  }, [searchParams, setValue]);

  const handleModifyPrompt = () => {
    setShowContentBlocked(false);
    // Focus on the prompt input
    const promptInput = document.getElementById('prompt');
    if (promptInput) {
      promptInput.focus();
    }
  };

  const handleCloseBlockedDialog = () => {
    setShowContentBlocked(false);
    setBlockedReason('');
    setBlockedCategory(undefined);
  };

  const startCourseProgressMonitoring = (courseId: string) => {
    console.log('🔄 Starting course progress monitoring for:', courseId);

    let lastServerProgress = 0;
    let simulatedProgress = 5;

    // Start with initial progress
    setCourseProgress(5);

    // Simulate gradual progress increase
    const progressSimulator = setInterval(() => {
      setCourseProgress(prev => {
        const newProgress = Math.min(
          prev + Math.random() * 2,
          lastServerProgress
        );
        return Math.round(newProgress);
      });
    }, 500);

    const checkProgress = async () => {
      try {
        console.log('🔍 Checking course progress...');
        const response = await fetch(`/api/courses/${courseId}/status`);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Course status data:', data);

          const serverProgress = data.progress || 0;
          lastServerProgress = serverProgress;

          console.log(`📈 Server progress: ${serverProgress}%`);

          if (
            data.status === 'READY' ||
            data.status === 'COMPLETE' ||
            serverProgress >= 100
          ) {
            console.log('✅ Course is ready!');
            clearInterval(progressSimulator);
            setCourseProgress(100);
            setIsCourseReady(true);
            return; // Stop monitoring
          }
        } else {
          console.error('❌ Failed to fetch course status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error checking course progress:', error);
      }

      // Continue monitoring every 3 seconds
      setTimeout(checkProgress, 3000);
    };

    // Start checking after 2 seconds
    setTimeout(checkProgress, 2000);
  };

  const handleGameComplete = () => {
    if (createdCourseId) {
      router.push(`/courses/${createdCourseId}`);
    }
  };

  const handleCancelCreation = async () => {
    if (!createdCourseId) return;

    setIsCancelling(true);

    try {
      const response = await fetch(`/api/courses/${createdCourseId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Creación cancelada',
          description: 'La creación del curso ha sido cancelada.',
        });

        // Reset all states
        setShowMemoryGame(false);
        setIsCreatingCourse(false);
        setCourseProgress(0);
        setIsCourseReady(false);
        setCreatedCourseId(null);

        // Go to dashboard
        router.push('/dashboard');
      } else {
        throw new Error('Failed to cancel course creation');
      }
    } catch (error) {
      console.error('Error cancelling course creation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la creación del curso.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const onSubmit = async (data: CourseForm) => {
    // Show memory game immediately as loading screen
    setIsCreatingCourse(true);
    setShowMemoryGame(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Content blocked') {
          // Show content blocked dialog
          setBlockedReason(
            result.message || result.reason || 'Contenido no permitido'
          );
          setBlockedCategory(result.category);
          setShowContentBlocked(true);
          setIsCreatingCourse(false);
          setShowMemoryGame(false);
          return;
        } else if (result.upgradeRequired) {
          toast({
            title: 'Límite de cursos alcanzado',
            description:
              result.error + ' Actualiza tu plan para crear más cursos.',
            variant: 'destructive',
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/plans')}
              >
                Ver Planes
              </Button>
            ),
          });
        } else {
          toast({
            title: 'Error',
            description: result.error || 'No se pudo crear el curso',
            variant: 'destructive',
          });
        }
        setIsCreatingCourse(false);
        setShowMemoryGame(false);
        return;
      }

      // Course created successfully, continue with memory game
      console.log(
        '🎮 Course created, continuing with memory game...',
        result.id
      );
      setCreatedCourseId(result.id);
      startCourseProgressMonitoring(result.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsCreatingCourse(false);
    }
  };

  // Show memory game as the main loading screen
  if (showMemoryGame || isCreatingCourse) {
    console.log('🎮 Rendering memory game as loading screen...');
    return (
      <MemoryGame
        onGameComplete={handleGameComplete}
        courseProgress={courseProgress}
        isCourseReady={isCourseReady}
        onCancelCreation={handleCancelCreation}
        isCancelling={isCancelling}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg animate-pulse">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-4">
              Crear Nuevo Curso
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Describe el curso que quieres crear y personaliza tu experiencia
              de aprendizaje con IA
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Course Prompt */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  Descripción del Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="prompt"
                    className="text-base font-semibold text-slate-700 dark:text-slate-300"
                  >
                    ¿Qué curso quieres crear?
                  </Label>
                  <textarea
                    id="prompt"
                    placeholder="Describe el curso que quieres crear... (ej: 'Crear un curso completo sobre React hooks para principiantes que incluya ejemplos prácticos')"
                    {...register('prompt')}
                    disabled={isCreatingCourse}
                    className="flex min-h-[140px] w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                    rows={5}
                  />
                  {errors.prompt && (
                    <p className="text-sm text-red-500 font-medium">
                      {errors.prompt.message}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                    💡 Sé específico sobre el tema, nivel y enfoque que deseas
                    para tu curso.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Course Level */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  Nivel de Dificultad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="level"
                    className="text-base font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Selecciona el nivel del curso
                  </Label>
                  <Select
                    onValueChange={value =>
                      setValue(
                        'level',
                        value as 'principiante' | 'intermedio' | 'avanzado'
                      )
                    }
                    disabled={isCreatingCourse}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200">
                      <SelectValue placeholder="Selecciona el nivel del curso" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-xl">
                      <SelectItem value="principiante" className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Principiante
                        </div>
                      </SelectItem>
                      <SelectItem value="intermedio" className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Intermedio
                        </div>
                      </SelectItem>
                      <SelectItem value="avanzado" className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Avanzado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-red-500 font-medium">
                      {errors.level.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center pt-8 pb-12">
              <Button
                type="submit"
                disabled={isCreatingCourse}
                size="lg"
                className="px-12 py-4 h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:transform-none disabled:opacity-70"
              >
                {isCreatingCourse ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Creando Curso...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-5 w-5" />
                    Crear Curso con IA
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Content Blocked Dialog */}
      <ContentBlockedDialog
        isOpen={showContentBlocked}
        onClose={handleCloseBlockedDialog}
        onModifyPrompt={handleModifyPrompt}
        reason={blockedReason}
        category={blockedCategory}
      />
    </div>
  );
}
