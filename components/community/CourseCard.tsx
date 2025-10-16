'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, Trash2, Eye, Star } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  description: string;
  userLevel: string;
  totalModules: number;
  totalCompletions: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    plan: string;
  };
}

interface CourseCardProps {
  course: Course;
  currentUserId?: string;
  onDelete?: (courseId: string) => void;
}

export function CourseCard({
  course,
  currentUserId,
  onDelete,
}: CourseCardProps) {
  
  const [isDeleting, setIsDeleting] = useState(false);

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

  const isOwner = currentUserId === course.user.id;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge className={getLevelColor(course.userLevel)}>
            {course.userLevel}
          </Badge>
          <div className="flex items-center gap-2">
            {isOwner && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                aria-label="Eliminar curso"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{course.totalModules} módulos</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.totalCompletions} completados</span>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserAvatar name={course.user.name} size={32} />
            <div>
              <p className="text-sm font-medium">{course.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(course.createdAt)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" variant="outline" asChild>
          <Link href={`/courses/${course.id}`} aria-label={`Ver curso ${course.title}`}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Curso
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
