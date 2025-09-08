'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CourseShell } from '@/components/course/CourseShell';
import { Loader2 } from 'lucide-react';
import { CourseFullResponse, CourseStatusResponse } from '@/lib/dto/course';

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default function CoursePage({ params }: CoursePageProps) {
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<CourseFullResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseId, setCourseId] = useState<string>('');

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
      const response = await fetch(`/api/courses/${courseId}`);
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Cargando curso...
            </h2>
            <p className="text-muted-foreground">
              Preparando tu experiencia de aprendizaje
            </p>
          </div>
        </div>
      </div>
    );
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

  return <CourseShell course={course} />;
}
