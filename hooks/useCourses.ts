'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { Course } from '@/lib/dto/course';

// Query keys for consistent caching
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...courseKeys.lists(), { filters }] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  userPlan: () => ['userPlan'] as const,
};

// Fetch user courses
export function useCourses() {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async (): Promise<Course[]> => {
      const response = await fetch('/api/courses', {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single course
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: async (): Promise<Course> => {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      return response.json();
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch user plan
export function useUserPlan() {
  return useQuery({
    queryKey: courseKeys.userPlan(),
    queryFn: async () => {
      const response = await fetch('/api/user/plan');

      if (!response.ok) {
        throw new Error('Failed to fetch user plan');
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - user plan changes less frequently
  });
}

// Delete course mutation with optimistic updates
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      return response.json();
    },
    onMutate: async courseId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: courseKeys.lists() });

      // Snapshot the previous value
      const previousCourses = queryClient.getQueryData<Course[]>(
        courseKeys.lists()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Course[]>(
        courseKeys.lists(),
        old => old?.filter(course => course.id !== courseId) ?? []
      );

      // Return a context object with the snapshotted value
      return { previousCourses };
    },
    onError: (err, courseId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(courseKeys.lists(), context?.previousCourses);

      toast({
        title: 'Error',
        description: 'No se pudo eliminar el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Curso eliminado',
        description: 'El curso ha sido eliminado exitosamente.',
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

// Create course mutation
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseData: {
      title: string;
      description: string;
      level: string;
      interests: string[];
    }) => {
      // Transform data to match API schema
      const apiData = {
        prompt: courseData.description, // Use description as prompt
        level: courseData.level,
      };
      
      console.log('📝 Sending course creation request:', apiData);
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      return response.json();
    },
    onSuccess: data => {
      // Invalidate and refetch courses
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });

      toast({
        title: '¡Curso creado!',
        description:
          'Tu curso se está generando. Te notificaremos cuando esté listo.',
      });

      // Redirect to course page
      router.push(`/courses/${data.id}`);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el curso. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}
