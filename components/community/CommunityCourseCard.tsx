'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, Eye, Star, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserPlan } from '@/lib/plans';

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

interface CommunityCourseCardProps {
  course: Course;
  currentUserId?: string;
  userPlan?: string;
}

export function CommunityCourseCard({
  course,
  currentUserId,
  userPlan,
}: CommunityCourseCardProps) {
  const router = useRouter();

  // Debug log temporal
  console.log('🔍 Debug CommunityCourseCard - course.user:', course.user);

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

  const handleViewCourse = () => {
    router.push(`/courses/${course.id}?from=community`);
  };

  const isOwner = currentUserId === course.user.id;
  const canView =
    userPlan === UserPlan.EXPERTO || userPlan === UserPlan.MAESTRO;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge className={getLevelColor(course.userLevel)}>
            {course.userLevel}
          </Badge>
          {!canView && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-600"
            >
              <Lock className="h-3 w-3 mr-1" />
              Plan Requerido
            </Badge>
          )}
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
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {course.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
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
        <Button
          className={cn(
            'w-full',
            canView
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed'
          )}
          onClick={canView ? handleViewCourse : undefined}
          disabled={!canView}
        >
          {canView ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Ver Curso
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Plan EXPERTO/MAESTRO Requerido
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
