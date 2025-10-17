'use client';

import { Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';

import { CommunityCourseCard } from '@/components/community/CommunityCourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommunityCourseCardSkeleton } from '@/components/ui/skeleton-card';
import { useCommunityCourses } from '@/hooks/useCommunity';
import { useDebounce } from '@/hooks/useDebounce';
import { UserPlan } from '@/lib/plans';

// interface Course {
//   id: string;
//   title: string;
//   description: string;
//   userLevel: string;
//   totalModules: number;
//   totalCompletions: number;
//   createdAt: string;
//   user: {
//     id: string;
//     name: string;
//     username: string;
//     plan: string;
//   };
// }

export default function CommunityPage() {
  const { data: session } = useSession();

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Debounce search input to avoid too many API calls
  const debouncedSearch = useDebounce(search, 300);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      page,
      search: debouncedSearch,
      level,
      sortBy,
    }),
    [page, debouncedSearch, level, sortBy]
  );

  // Use React Query hook for data fetching
  const {
    data: communityData,
    isLoading,
    error,
  } = useCommunityCourses(filters);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleLevelChange = (value: string) => {
    setLevel(value);
    setPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1); // Reset to first page when sorting
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Comunidad de Cursos</h1>
          <p className="text-muted-foreground">
            Inicia sesión para explorar la comunidad de cursos.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Comunidad de Cursos</h1>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow">
            <div className="h-10 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-[180px] bg-muted rounded-md animate-pulse" />
          <div className="h-10 w-[180px] bg-muted rounded-md animate-pulse" />
        </div>

        {/* Courses Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CommunityCourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error al cargar cursos</h1>
          <p className="text-muted-foreground mb-4">
            No se pudieron cargar los cursos de la comunidad.
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!communityData?.canAccessCommunity) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Comunidad de Cursos</h1>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <h2 className="text-2xl font-semibold">Acceso Restringido</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Para acceder a la comunidad de cursos, necesitas tener un plan
              activo.
            </p>
            <Button onClick={() => (window.location.href = '/dashboard/plans')}>
              Ver Planes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { courses, pagination, userPlan } = communityData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Comunidad de Cursos</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={level} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="beginner">Principiante</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más recientes</SelectItem>
            <SelectItem value="popular">Más populares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 && !isLoading ? (
        <p className="text-center text-muted-foreground">
          No se encontraron cursos que coincidan con tu búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CommunityCourseCard
              key={course.id}
              course={course}
              userPlan={userPlan as UserPlan}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setPage(prev => Math.min(pagination.totalPages, prev + 1))
              }
              disabled={page === pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
