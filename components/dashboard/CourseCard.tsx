'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Trash2,
  Upload,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  isPublic?: boolean;
}

interface CourseCardProps {
  course: Course;
  onDelete?: (courseId: string) => void;
  onPublish?: (courseId: string) => void;
  userPlan?: UserPlan | null;
}

export function CourseCard({ course, onDelete, onPublish, userPlan }: CourseCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);


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

  const progressPercentage = course.totalModules > 0 
    ? Math.round((course.completedModules / course.totalModules) * 100)
    : 0;

  const handleOpenCourse = () => {
    router.push(`/courses/${course.id}`);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(course.id);
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    
    setIsPublishing(true);
    try {
      await onPublish(course.id);
    } catch (error) {
      console.error('Error publishing course:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
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
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
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
            Creado: {formatDate(course.createdAt)}
          </span>
          {course.completedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completado: {formatDate(course.completedAt)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="space-y-2">
          {/* Open Course Button - Blue */}
          <Button 
            onClick={handleOpenCourse}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {course.status === 'complete' ? 'Ver Curso' : 'Abrir Curso'}
          </Button>
          
          {/* Publish Button - Green if MAESTRO and not published, Gray if not MAESTRO or already published */}
          {onPublish && (
            <Button 
              onClick={handlePublish}
              className={cn(
                "w-full",
                userPlan === UserPlan.MAESTRO && !course.isPublic
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed"
              )}
              disabled={isPublishing || userPlan !== UserPlan.MAESTRO || course.isPublic}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {course.isPublic 
                    ? 'Ya Publicado' 
                    : userPlan === UserPlan.MAESTRO
                      ? 'Publicar en Comunidad' 
                      : 'Plan MAESTRO Requerido'
                  }
                </>
              )}
            </Button>
          )}
          
          {/* Public Status Badge */}
          {course.isPublic && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Eye className="h-4 w-4" />
              <span>Publicado en Comunidad</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
