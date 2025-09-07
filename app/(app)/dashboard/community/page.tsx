'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Star,
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityCourseCard } from '@/components/community/CommunityCourseCard';
import { useToast } from '@/components/ui/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  userLevel: string;
  totalModules: number;
  averageRating: number;
  totalRatings: number;
  totalCompletions: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    plan: string;
  };
  _count: {
    courseRatings: number;
  };
}

interface CommunityCoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  userPlan: string;
  canAccessCommunity: boolean;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [userPlan, setUserPlan] = useState<string>('');
  const [canAccessCommunity, setCanAccessCommunity] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(level && level !== 'all' && { level }),
        ...(sortBy && { sortBy }),
      });

      const response = await fetch(`/api/community?${params}`);
      if (response.ok) {
        const data: CommunityCoursesResponse = await response.json();
        setCourses(data.courses);
        setPagination(data.pagination);
        setUserPlan(data.userPlan);
        setCanAccessCommunity(data.canAccessCommunity);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateCourse = async (courseId: string, rating: number) => {
    try {
      const response = await fetch('/api/community/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId, rating }),
      });

      if (response.ok) {
        // Actualizar la calificación local
        setUserRatings(prev => ({ ...prev, [courseId]: rating }));

        // Actualizar el curso en la lista
        setCourses(prev =>
          prev.map(course =>
            course.id === courseId
              ? { ...course, totalRatings: course.totalRatings + 1 }
              : course
          )
        );

        toast({
          title: 'Calificación guardada',
          description: 'Tu calificación se ha guardado exitosamente.',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rate course');
      }
    } catch (error) {
      console.error('Error rating course:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la calificación. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, search, level, sortBy]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleLevelChange = (value: string) => {
    setLevel(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-4 w-4',
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        )}
      />
    ));
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

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Comunidad de Cursos</h1>
          <p>Inicia sesión para acceder a la comunidad</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de restricción de plan si no puede acceder
  if (!canAccessCommunity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Acceso Restringido</h1>
            <p className="text-muted-foreground mb-6">
              Necesitas un plan{' '}
              <span className="font-semibold text-blue-600">EXPERTO</span> o{' '}
              <span className="font-semibold text-purple-600">MAESTRO</span>{' '}
              para acceder a la comunidad de cursos.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Plan actual: <span className="font-medium">{userPlan}</span>
            </p>
            <Button asChild className="w-full">
              <a href="/dashboard/plans">
                <Star className="h-4 w-4 mr-2" />
                Mejorar Plan
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Comunidad de Cursos</h1>
        <p className="text-muted-foreground">
          Descubre cursos creados por la comunidad y comparte tus conocimientos
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Level Filter */}
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="beginner">Principiante</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="rating">Mejor calificados</SelectItem>
                <SelectItem value="completions">Más completados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No se encontraron cursos
            </h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {courses.map(course => (
              <CommunityCourseCard
                key={course.id}
                course={course}
                currentUserId={session?.user?.id}
                userPlan={userPlan}
                onRate={handleRateCourse}
                userRating={userRatings[course.id] || 0}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Página {page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
