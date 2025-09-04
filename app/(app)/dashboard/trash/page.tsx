'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Trash2, 
  RotateCcw, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface DeletedCourse {
  id: string;
  courseId: string;
  title: string;
  description: string;
  status: string;
  status_display: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string;
  totalModules: number;
  completedModules: number;
}

export default function TrashPage() {
  const [courses, setCourses] = useState<DeletedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchDeletedCourses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/courses/trash');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        throw new Error('Failed to fetch deleted courses');
      }
    } catch (error) {
      console.error('Error fetching deleted courses:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cursos eliminados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedCourses();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRestore = async (courseId: string) => {
    setRestoring(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
        toast({
          title: 'Curso restaurado',
          description: 'El curso se ha restaurado exitosamente.',
        });
      } else {
        throw new Error('Failed to restore course');
      }
    } catch (error) {
      console.error('Error restoring course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo restaurar el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (courseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar permanentemente este curso? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleting(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/permanent-delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
        toast({
          title: 'Curso eliminado permanentemente',
          description: 'El curso se ha eliminado de forma permanente.',
        });
      } else {
        throw new Error('Failed to permanently delete course');
      }
    } catch (error) {
      console.error('Error permanently deleting course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar permanentemente el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando papelera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trash2 className="h-8 w-8" />
              Papelera
            </h1>
            <p className="text-muted-foreground">
              Cursos eliminados. Puedes restaurarlos o eliminarlos permanentemente.
            </p>
          </div>
        </div>
      </div>

      {/* Courses */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Papelera vacía</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              No hay cursos eliminados. Los cursos que elimines aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const progressPercentage = course.totalModules > 0 
              ? Math.round((course.completedModules / course.totalModules) * 100)
              : 0;

            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
                        {course.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(course.status)}
                      <Badge className={getStatusColor(course.status)}>
                        {course.status_display}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Progress */}
                  {course.totalModules > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{course.completedModules}/{course.totalModules} módulos</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Eliminado: {formatDate(course.deletedAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(course.id)}
                      disabled={restoring === course.id}
                      className="flex-1"
                    >
                      {restoring === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Restaurar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDelete(course.id)}
                      disabled={deleting === course.id}
                      className="flex-1"
                    >
                      {deleting === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
