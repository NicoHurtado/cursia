'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Target,
  User,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

type FunnelStep = 'description' | 'preferences' | 'signup' | 'creating';

interface CourseData {
  description: string;
  level: string;
  interests: string[];
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const levelOptions = [
  {
    value: 'BEGINNER',
    label: 'Principiante',
    description: 'Nuevo en este tema',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermedio',
    description: 'Tengo conocimientos básicos',
  },
  {
    value: 'ADVANCED',
    label: 'Avanzado',
    description: 'Tengo experiencia en el área',
  },
];

const interestOptions = [
  'Tecnología',
  'Marketing',
  'Diseño',
  'Negocios',
  'Ciencias',
  'Arte',
  'Idiomas',
  'Salud',
  'Deportes',
  'Cocina',
  'Música',
  'Fotografía',
];

export function CourseFunnelModal({
  isOpen,
  onClose,
  initialPrompt = '',
}: CourseFunnelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Determine initial step based on whether we have a prompt
  // If we have a prompt from landing page, go directly to signup
  const initialStep = initialPrompt.trim() ? 'signup' : 'description';
  const [step, setStep] = useState<FunnelStep>(initialStep);

  const [courseData, setCourseData] = useState<CourseData>({
    description: initialPrompt,
    level: '',
    interests: [],
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Reset modal state when it opens/closes or when initialPrompt changes
  useEffect(() => {
    if (isOpen) {
      const newInitialStep = initialPrompt.trim() ? 'signup' : 'description';
      console.log('Modal opening with:', { initialPrompt, newInitialStep });
      setStep(newInitialStep);
      setCourseData({
        description: initialPrompt,
        level: 'INTERMEDIATE', // Default level when coming from landing
        interests: ['Tecnología'], // Default interest when coming from landing
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [isOpen, initialPrompt]);

  const handleNext = () => {
    if (step === 'description') setStep('preferences');
    else if (step === 'preferences') setStep('signup');
    else if (step === 'signup') handleCreateAccountAndCourse();
  };

  const handleBack = () => {
    if (step === 'preferences') {
      setStep('description');
    } else if (step === 'signup') {
      // If we started with signup (had initial prompt), close modal
      // If we started with description, go back to preferences
      if (initialPrompt.trim()) {
        onClose();
      } else {
        setStep('preferences');
      }
    }
  };

  const handleInterestToggle = (interest: string) => {
    setCourseData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleCreateAccountAndCourse = async () => {
    setIsLoading(true);
    setStep('creating');

    try {
      // 1. Create user account
      const signupResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: courseData.username, // Use username as name
          email: courseData.email,
          username: courseData.username,
          password: courseData.password,
          level: courseData.level,
          interests: courseData.interests,
        }),
      });

      if (!signupResponse.ok) {
        const error = await signupResponse.json();
        throw new Error(error.error || 'Error creating account');
      }

      // 2. Sign in the user
      const { signIn } = await import('next-auth/react');
      const signInResult = await signIn('credentials', {
        email: courseData.email,
        password: courseData.password,
        redirect: false,
      });

      if (!signInResult?.ok) {
        throw new Error('Error signing in');
      }

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Redirect to create course page with the prompt
      onClose();
      router.push(
        '/dashboard/create-course?prompt=' +
          encodeURIComponent(courseData.description)
      );
      return;

      // 3. Convert level to the format expected by the API
      const levelMapping = {
        BEGINNER: 'principiante',
        INTERMEDIATE: 'intermedio',
        ADVANCED: 'avanzado',
      } as const;

      const mappedLevel =
        levelMapping[courseData.level as keyof typeof levelMapping];

      // Validate that the level mapping worked
      if (!mappedLevel) {
        console.error('Invalid level mapping:', {
          originalLevel: courseData.level,
          availableMappings: Object.keys(levelMapping),
        });
        throw new Error(`Invalid level: ${courseData.level}`);
      }

      console.log('Course creation request data:', {
        prompt: courseData.description,
        level: courseData.level,
        mappedLevel: mappedLevel,
        interests: courseData.interests,
      });

      // 4. Create the course (this MUST succeed for the user to get what they asked for)
      let courseResponse;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        courseResponse = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: courseData.description,
            level: mappedLevel,
            interests: courseData.interests,
          }),
        });

        // If successful or not an auth issue, break
        if (courseResponse.ok || courseResponse.status !== 401) {
          break;
        }

        // If unauthorized, wait and retry
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(
            `Retrying course creation (attempt ${retryCount + 1}/${maxRetries + 1})`
          );
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!courseResponse.ok) {
        let errorData;
        try {
          errorData = await courseResponse.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: 'Failed to parse server response' };
        }

        console.error('Course creation failed after retries:', {
          status: courseResponse.status,
          statusText: courseResponse.statusText,
          error: errorData,
          retryCount: retryCount,
          requestData: {
            prompt: courseData.description,
            level: courseData.level,
            mappedLevel: mappedLevel,
            interests: courseData.interests,
          },
        });

        // Show error message to user
        const errorMessage =
          errorData?.error ||
          `Course creation failed (${courseResponse.status}: ${courseResponse.statusText})`;
        alert(
          `Error creating course: ${errorMessage}\n\nYou'll be redirected to the course creation page where you can try again.`
        );

        // Even if course creation fails, user is logged in, so redirect them
        // but we should notify them about the issue
        onClose();
        router.push(
          '/dashboard/create-course?prompt=' +
            encodeURIComponent(courseData.description)
        );
        return;
      }

      const createdCourse = await courseResponse.json();
      console.log('Course created successfully:', createdCourse);

      // Success! User has their course - redirect to dashboard
      onClose();
      router.push('/dashboard/courses');
    } catch (error) {
      console.error('Error in account creation/signin:', error);
      // Only show error if account creation or signin failed
      setStep('signup'); // Go back to signup step
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'description':
        return courseData.description.trim().length > 10;
      case 'preferences':
        return courseData.level && courseData.interests.length > 0;
      case 'signup':
        return (
          courseData.email &&
          courseData.username &&
          courseData.password.length >= 6 &&
          courseData.confirmPassword.length >= 6 &&
          courseData.password === courseData.confirmPassword
        );
      default:
        return false;
    }
  };

  const getStepIcon = (stepName: FunnelStep) => {
    switch (stepName) {
      case 'description':
        return BookOpen;
      case 'preferences':
        return Target;
      case 'signup':
        return User;
      case 'creating':
        return Loader2;
    }
  };

  const stepTitles = {
    description: 'Describe tu curso ideal',
    preferences: 'Personaliza tu experiencia',
    signup: initialPrompt.trim()
      ? 'Crea tu cuenta para generar tu curso'
      : 'Crea tu cuenta',
    creating: 'Creando tu curso...',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {stepTitles[step]}
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          {(() => {
            // Show different steps based on whether we have an initial prompt
            const stepsToShow = initialPrompt.trim()
              ? (['signup'] as FunnelStep[])
              : (['description', 'preferences', 'signup'] as FunnelStep[]);

            return stepsToShow.map((stepName, index) => {
              const StepIcon = getStepIcon(stepName);
              const isActive = step === stepName;
              const isCompleted = stepsToShow.indexOf(step) > index;

              return (
                <div key={stepName} className="flex items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      isActive || isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  {index < stepsToShow.length - 1 && (
                    <div
                      className={cn(
                        'w-16 h-0.5 mx-2',
                        isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Step content */}
        <div className="space-y-6">
          {step === 'description' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  ¿Qué curso te gustaría crear?
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe el tema, enfoque o habilidades que quieres enseñar
                </p>
              </div>
              <textarea
                id="description"
                value={courseData.description}
                onChange={e =>
                  setCourseData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Ej: Un curso completo de React para principiantes, incluyendo hooks, componentes y manejo de estado..."
                className="w-full min-h-[120px] p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 10 caracteres ({courseData.description.length}/10)
              </p>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6">
              {initialPrompt.trim() && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Tu curso:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                    "{courseData.description}"
                  </p>
                </div>
              )}

              <div>
                <Label className="text-base font-medium">
                  Nivel de dificultad
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  ¿A qué audiencia está dirigido tu curso?
                </p>
                <div className="grid gap-3 mt-3">
                  {levelOptions.map(option => (
                    <div
                      key={option.value}
                      onClick={() =>
                        setCourseData(prev => ({
                          ...prev,
                          level: option.value,
                        }))
                      }
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50',
                        courseData.level === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2',
                            courseData.level === option.value
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/30'
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Áreas de interés
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona las áreas que más te interesan (mínimo 1)
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={cn(
                        'p-3 text-sm border rounded-lg transition-all hover:border-primary/50',
                        courseData.interests.includes(interest)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccionados: {courseData.interests.length}
                </p>
              </div>
            </div>
          )}

          {step === 'signup' && (
            <div className="space-y-4">
              {initialPrompt.trim() && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Tu curso:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                    "{courseData.description}"
                  </p>
                </div>
              )}

              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  {initialPrompt.trim()
                    ? 'Crea tu cuenta para generar tu curso personalizado'
                    : 'Casi listo! Crea tu cuenta para generar tu curso personalizado'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/login');
                    }}
                    className="text-primary hover:text-primary/80 underline font-medium"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>

              <div>
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={courseData.username}
                  onChange={e =>
                    setCourseData(prev => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="usuario123"
                />
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={courseData.email}
                  onChange={e =>
                    setCourseData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={courseData.password}
                  onChange={e =>
                    setCourseData(prev => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={courseData.confirmPassword}
                  onChange={e =>
                    setCourseData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirma tu contraseña"
                />
                {courseData.password &&
                  courseData.confirmPassword &&
                  courseData.password !== courseData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium mb-2">
                Creando tu cuenta y curso...
              </h3>
              <p className="text-muted-foreground">
                Esto puede tomar unos minutos. ¡Estamos preparando todo para ti!
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {step !== 'creating' && (
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={step === 'description' ? onClose : handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 'description'
                ? 'Cancelar'
                : step === 'preferences' && initialPrompt.trim()
                  ? 'Cancelar'
                  : 'Anterior'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {step === 'signup' ? 'Crear curso' : 'Siguiente'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
