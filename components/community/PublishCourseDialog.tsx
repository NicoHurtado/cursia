'use client';

import { Upload, BookOpen, Calendar, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  description: string;
  userLevel: string;
  totalModules: number;
  status: string;
  createdAt: string;
  isPublic: boolean;
}

interface PublishCourseDialogProps {
  onCoursePublished?: () => void;
}

export function PublishCourseDialog({
  onCoursePublished,
}: PublishCourseDialogProps) {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo cursos completados y no públicos
        const availableCourses = data.courses.filter(
          (course: Course) => course.status === 'COMPLETE' && !course.isPublic
        );
        setCourses(availableCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const handlePublish = async (courseId: string) => {
    try {
      setPublishing(courseId);
      const response = await fetch('/api/community/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        // Remover el curso de la lista
        setCourses(prev => prev.filter(course => course.id !== courseId));
        onCoursePublished?.();
      } else {
        const error = await response.json();
        console.error('Error publishing course:', error);
      }
    } catch (error) {
      console.error('Error publishing course:', error);
    } finally {
      setPublishing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Publicar Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar Curso en la Comunidad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando cursos...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay cursos disponibles
              </h3>
              <p className="text-muted-foreground">
                Completa un curso para poder publicarlo en la comunidad
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getLevelColor(course.userLevel)}>
                          {course.userLevel}
                        </Badge>
                        <Badge variant="outline">
                          {course.totalModules} módulos
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Creado {formatDate(course.createdAt)}</span>
                    </div>

                    <Button
                      onClick={() => handlePublish(course.id)}
                      disabled={publishing === course.id}
                      size="sm"
                    >
                      {publishing === course.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Publicar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
