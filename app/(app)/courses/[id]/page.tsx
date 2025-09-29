'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CourseShell } from '@/components/course/CourseShell';
import { CommunityCourseIntro } from '@/components/course/CommunityCourseIntro';
import { Loader2 } from 'lucide-react';
import { NormalLoadingScreen } from '@/components/ui/normal-loading-screen';
import { CourseFullResponse, CourseStatusResponse } from '@/lib/dto/course';
import { useToast } from '@/components/ui/use-toast';
import { safeJsonParseArray } from '@/lib/json-utils';

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default function CoursePage({ params }: CoursePageProps) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseFullResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaking, setIsTaking] = useState(false);
  const [courseId, setCourseId] = useState<string>('');

  // Check if coming from community
  const fromCommunity = searchParams.get('from') === 'community';

  // Await params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Fetch course data
  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (!courseId) return;

    const loadData = async () => {
      setIsLoading(true);
      await fetchCourse();
      setIsLoading(false);
    };
    loadData();
  }, [courseId]);

  const handleTakeCourse = async () => {
    if (!course) return;

    setIsTaking(true);
    try {
      const response = await fetch('/api/community/take-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: course.id }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: '¡Curso tomado exitosamente!',
          description:
            'El curso ha sido agregado a tu perfil. Puedes encontrarlo en "Mis Cursos".',
        });
        // Redirect to dashboard
        router.push('/dashboard/courses');
      } else {
        const error = await response.json();

        // Si ya tiene el curso, redirigir al curso existente
        if (
          response.status === 409 &&
          error.redirect &&
          error.existingCourseId
        ) {
          toast({
            title: 'Ya tienes este curso',
            description: 'Te redirigimos a tu versión personal del curso.',
          });
          router.push(`/courses/${error.existingCourseId}`);
          return;
        }

        throw new Error(error.error || 'Error al tomar el curso');
      }
    } catch (error) {
      console.error('Error taking course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo tomar el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsTaking(false);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard/community');
  };

  if (status === 'loading' || isLoading) {
    return <NormalLoadingScreen message="Cargando curso..." />;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Please sign in to view this course.
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground">
            The course you're looking for doesn't exist or you don't have access
            to it.
          </p>
        </div>
      </div>
    );
  }
  // Show community course intro if coming from community
  if (fromCommunity && course.isPublic) {
    return (
      <CommunityCourseIntro
        title={course.title || 'Course'}
        description={course.description || ''}
        level={course.userLevel || 'BEGINNER'}
        language={course.language}
        totalModules={course.totalModules}
        topics={Array.isArray(course.topics) ? course.topics : safeJsonParseArray(course.topics)}
        prerequisites={Array.isArray(course.prerequisites) ? course.prerequisites : safeJsonParseArray(course.prerequisites)}
        totalSizeEstimate={course.totalSizeEstimate || ''}
        modules={course.modules.map(module => ({
          title: module.title,
          description: module.description || '',
        }))}
        createdBy={course.originalAuthorId || course.user?.id || ''}
        authorName={course.originalAuthorName || course.user?.name || 'Usuario'}
        authorUsername={
          course.originalAuthorUsername || course.user?.username || 'usuario'
        }
        publishedAt={course.publishedAt || course.createdAt}
        onTakeCourse={handleTakeCourse}
        onGoBack={handleGoBack}
        isTaking={isTaking}
      />
    );
  }

  return <CourseShell course={course} />;
}
