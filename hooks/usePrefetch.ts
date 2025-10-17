'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { courseKeys } from './useCourses';

/**
 * Hook for prefetching data based on user interactions
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Prefetch user plan when hovering over plan-related elements
  const prefetchUserPlan = () => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.userPlan(),
      queryFn: async () => {
        const response = await fetch('/api/user/plan');
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch user plan');
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Prefetch community courses when hovering over community link
  const prefetchCommunityCourses = () => {
    queryClient.prefetchQuery({
      queryKey: [
        'community',
        'list',
        { filters: { page: 1, search: '', level: 'all', sortBy: 'newest' } },
      ],
      queryFn: async () => {
        const response = await fetch('/api/community?page=1&limit=12');
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch community courses');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Prefetch course details when hovering over course cards
  const prefetchCourse = (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.detail(courseId),
      queryFn: async () => {
        const response = await fetch(`/api/courses/${courseId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch course');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Prefetch courses when hovering over dashboard link
  const prefetchCourses = () => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.lists(),
      queryFn: async () => {
        const response = await fetch('/api/courses', {
          headers: {
            'Cache-Control': 'max-age=300',
          },
        });
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch courses');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    prefetchUserPlan,
    prefetchCommunityCourses,
    prefetchCourse,
    prefetchCourses,
  };
}
