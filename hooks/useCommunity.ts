'use client';

import { useQuery } from '@tanstack/react-query';

import { Course } from '@/lib/dto/course';

// Community query keys
export const communityKeys = {
  all: ['community'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...communityKeys.lists(), { filters }] as const,
};

interface CommunityCoursesResponse {
  courses: Course[];
  pagination: {
    currentPage: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  userPlan: string;
  canAccessCommunity: boolean;
}

// Fetch community courses with filters
export function useCommunityCourses(filters: {
  page: number;
  search: string;
  level: string;
  sortBy: string;
}) {
  return useQuery({
    queryKey: communityKeys.list(filters),
    queryFn: async (): Promise<CommunityCoursesResponse> => {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '12',
        ...(filters.search && { search: filters.search }),
        ...(filters.level &&
          filters.level !== 'all' && { level: filters.level }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
      });

      const response = await fetch(`/api/community?${params}`, {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch community courses');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
