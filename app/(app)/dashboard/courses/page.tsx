'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, BookOpen } from 'lucide-react';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { PlanStatus } from '@/components/dashboard/PlanStatus';
import { useToast } from '@/components/ui/use-toast';
import { UserPlan } from '@/lib/plans';

interface Course {
  id: string;
  courseId: string;
  title: string;
  description: string;
  status: string;
  status_display: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  totalModules: number;
  completedModules: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/plan');
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data.currentPlan);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/courses', {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cursos. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchUserPlan();
  }, []);

  const handleCreateCourse = () => {
    router.push('/create-course');
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the course from the local state
        setCourses(prev => prev.filter(course => course.id !== courseId));

        toast({
          title: 'Curso eliminado',
          description: 'El curso se ha movido a la papelera.',
        });
      } else {
        throw new Error('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/community/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        // Update the course in local state to mark it as public
        setCourses(prev =>
          prev.map(course =>
            course.id === courseId ? { ...course, isPublic: true } : course
          )
        );

        toast({
          title: 'Curso publicado',
          description: 'El curso se ha publicado exitosamente en la comunidad.',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish course');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo publicar el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Cursos</h1>
          <p className="text-muted-foreground">
            Gestiona y accede a todos tus cursos creados
          </p>
        </div>
        <Button
          onClick={handleCreateCourse}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Nuevo Curso
        </Button>
      </div>

      {/* Plan Status */}
      <PlanStatus />

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tienes cursos aún</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Crea tu primer curso personalizado con IA y comienza tu viaje de
              aprendizaje.
            </p>
            <Button onClick={handleCreateCourse} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Crear mi Primer Curso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={handleDeleteCourse}
              onPublish={handlePublishCourse}
              userPlan={userPlan}
            />
          ))}
        </div>
      )}
    </div>
  );
}
