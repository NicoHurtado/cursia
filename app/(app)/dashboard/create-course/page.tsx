'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, X, BookOpen, Sparkles } from 'lucide-react';
import { CourseLoadingScreen } from '@/components/course/CourseLoadingScreen';

const courseSchema = z.object({
  prompt: z
    .string()
    .min(10, 'El prompt debe tener al menos 10 caracteres')
    .max(2000, 'El prompt debe tener menos de 2000 caracteres'),
  level: z.enum(['principiante', 'intermedio', 'avanzado']),
  interests: z
    .array(z.string())
    .max(6, 'Máximo 6 intereses')
    .optional()
    .default([]),
});

type CourseForm = z.infer<typeof courseSchema>;

const interestCategories = {
  Tecnología: [
    'Programación',
    'Inteligencia Artificial',
    'Desarrollo Web',
    'Aplicaciones Móviles',
    'Ciberseguridad',
    'Datos y Analytics',
  ],
  Negocios: [
    'Marketing Digital',
    'Emprendimiento',
    'Finanzas',
    'Gestión de Proyectos',
    'Ventas',
    'Estrategia',
  ],
  Diseño: [
    'Diseño UX/UI',
    'Diseño Gráfico',
    'Fotografía',
    'Ilustración',
    'Branding',
    'Arquitectura',
  ],
  Educación: [
    'Enseñanza',
    'Psicología Educativa',
    'Desarrollo Personal',
    'Idiomas',
    'Investigación',
    'Metodologías',
  ],
  Creatividad: ['Música', 'Escritura', 'Arte', 'Cine', 'Teatro', 'Literatura'],
};

export default function CreateCoursePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
  });

  const interests = watch('interests') || [];

  const addInterest = (interest: string) => {
    if (!interests.includes(interest) && interests.length < 6) {
      const updatedInterests = [...interests, interest];
      setValue('interests', updatedInterests);
    }
  };

  const removeInterest = (interestToRemove: string) => {
    const updatedInterests = interests.filter(
      interest => interest !== interestToRemove
    );
    setValue('interests', updatedInterests);
  };

  const onSubmit = async (data: CourseForm) => {
    // Show loading screen immediately
    setIsCreatingCourse(true);

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
        if (result.upgradeRequired) {
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
        return;
      }

      // Redirect to course page (the loading screen will show there)
      router.push(`/courses/${result.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsCreatingCourse(false);
    }
  };

  // Show loading screen when creating course
  if (isCreatingCourse) {
    return <CourseLoadingScreen status="GENERATING_METADATA" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Crear Nuevo Curso
        </h1>
        <p className="text-muted-foreground">
          Describe el curso que quieres crear y personaliza tu experiencia de
          aprendizaje
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Course Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Descripción del Curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">¿Qué curso quieres crear?</Label>
              <textarea
                id="prompt"
                placeholder="Describe el curso que quieres crear... (ej: 'Crear un curso completo sobre React hooks para principiantes que incluya ejemplos prácticos')"
                {...register('prompt')}
                disabled={isCreatingCourse}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
              {errors.prompt && (
                <p className="text-sm text-destructive">
                  {errors.prompt.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Sé específico sobre el tema, nivel y enfoque que deseas para tu
                curso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Course Level */}
        <Card>
          <CardHeader>
            <CardTitle>Nivel de Dificultad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="level">Selecciona el nivel del curso</Label>
              <Select
                onValueChange={value =>
                  setValue(
                    'level',
                    value as 'principiante' | 'intermedio' | 'avanzado'
                  )
                }
                disabled={isCreatingCourse}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el nivel del curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-sm text-destructive">
                  {errors.level.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Intereses y Contexto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Selecciona intereses para personalizar ejemplos y ejercicios
              </Label>
              <p className="text-xs text-muted-foreground">
                Estos intereses se usarán para crear ejemplos y ejercicios más
                relevantes para ti.
              </p>
            </div>

            {/* Selected Interests */}
            {interests.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Intereses seleccionados ({interests.length}/6)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {interests.map(interest => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        aria-label={`Remover ${interest}`}
                        disabled={isCreatingCourse}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Categorías</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.keys(interestCategories).map(category => (
                  <Button
                    key={category}
                    type="button"
                    variant={
                      selectedCategory === category ? 'default' : 'outline'
                    }
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category ? null : category
                      )
                    }
                    disabled={isCreatingCourse}
                  >
                    <span className="font-medium">{category}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {
                        interestCategories[
                          category as keyof typeof interestCategories
                        ].length
                      }{' '}
                      opciones
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sub-interests */}
            {selectedCategory && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Intereses en {selectedCategory}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {interestCategories[
                    selectedCategory as keyof typeof interestCategories
                  ].map(interest => (
                    <Button
                      key={interest}
                      type="button"
                      variant={
                        interests.includes(interest) ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => addInterest(interest)}
                      disabled={
                        isCreatingCourse ||
                        interests.includes(interest) ||
                        interests.length >= 6
                      }
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {errors.interests && (
              <p className="text-sm text-destructive">
                {errors.interests.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center pt-8 pb-12">
          <Button
            type="submit"
            disabled={isCreatingCourse}
            size="lg"
            className="px-8"
          >
            {isCreatingCourse ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando Curso...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Crear Curso con IA
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
