'use client';

import { Plus, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { CourseCard } from '@/components/dashboard/CourseCard';
import { PlanStatus } from '@/components/dashboard/PlanStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CourseCardSkeleton,
  PlanStatusSkeleton,
} from '@/components/ui/skeleton-card';
import { useCourses, useDeleteCourse, useUserPlan } from '@/hooks/useCourses';

// interface Course {
//   id: string;
//   courseId: string;
//   title: string;
//   description: string;
//   status: string;
//   status_display: string;
//   createdAt: string;
//   updatedAt: string;
//   completedAt: string | null;
//   totalModules: number;
//   completedModules: number;
//   completionPercentage: number;
//   totalChunks: number;
//   completedChunks: number;
//   isPublic?: boolean;
// }

export default function CoursesPage() {
  const router = useRouter();

  // Use React Query hooks for data fetching
  const {
    data: courses = [],
    isLoading: coursesLoading,
    error: coursesError,
  } = useCourses();
  const { data: userPlanData, isLoading: planLoading } = useUserPlan();
  const deleteCourseMutation = useDeleteCourse();

  const handleCreateCourse = () => {
    router.push('/create-course');
  };

  const handleDeleteCourse = async (courseId: string) => {
    deleteCourseMutation.mutate(courseId);
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
        // The mutation will handle the optimistic update
        return;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish course');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      throw error; // Re-throw to let the dialog handle the toast
    }
  };

  const handleUnpublishCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/community/unpublish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        // The mutation will handle the optimistic update
        return;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unpublish course');
      }
    } catch (error) {
      console.error('Error unpublishing course:', error);
      throw error; // Re-throw to let the dialog handle the toast
    }
  };

  // Show loading state with skeletons
  if (coursesLoading || planLoading) {
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

        {/* Plan Status Skeleton */}
        <PlanStatusSkeleton />

        {/* Courses Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (coursesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error al cargar cursos</h3>
          <p className="text-muted-foreground mb-4">
            No se pudieron cargar los cursos. Inténtalo de nuevo.
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
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
              onUnpublish={handleUnpublishCourse}
              userPlan={userPlanData?.currentPlan}
            />
          ))}
        </div>
      )}
    </div>
  );
}
