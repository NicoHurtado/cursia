'use client';

import { Calendar, Layers3, Users, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

import { CommunityCourseCard } from '@/components/community/CommunityCourseCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// import { UserAvatar } from '@/components/ui/user-avatar';

interface PageParams {
  params: Promise<{ username: string }>;
}

interface ProfileUser {
  id: string;
  name: string;
  username: string;
  plan: string;
  level: string;
  createdAt: string;
}

interface ProfileMetrics {
  publicCourses: number;
  totalCompletions: number;
  totalRatings: number;
}

interface CourseForCard {
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

export default function UserProfilePage({ params }: PageParams) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [courses, setCourses] = useState<CourseForCard[]>([]);
  const [userPlan, setUserPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Resolve params
  useEffect(() => {
    const resolve = async () => {
      const p = await params;
      setUsername(p.username);
    };
    resolve();
  }, [params]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Fetch viewer plan
  const fetchViewerPlan = async () => {
    try {
      const resp = await fetch('/api/user/plan');
      if (resp.ok) {
        const data = await resp.json();
        setUserPlan(data.currentPlan);
      }
    } catch {
      // noop
    }
  };

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      const resp = await fetch(`/api/users/${username}`);
      if (resp.status === 401) {
        router.push('/login');
        return;
      }
      if (resp.ok) {
        const data = await resp.json();
        setUser(data.user);
        setMetrics(data.metrics);
        setCourses(data.courses);
      }
    } catch {
      // noop
    }
  }, [username, router]);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchViewerPlan()]);
      setLoading(false);
    };
    load();
  }, [username, fetchProfile]);

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="h-4 w-64 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>Inicia sesión para ver perfiles.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>Usuario no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>@{user.username}</span>
            <span>•</span>
            <span>Miembro desde {formatDate(user.createdAt)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">Plan {user.plan}</Badge>
            <Badge variant="outline">Nivel {user.level}</Badge>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cursos públicos</p>
                <p className="text-xl font-semibold">{metrics.publicCourses}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Completados totales
                </p>
                <p className="text-xl font-semibold">
                  {metrics.totalCompletions}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Calificaciones</p>
                <p className="text-xl font-semibold">{metrics.totalRatings}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Courses */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Cursos públicos</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Más recientes</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Este usuario aún no tiene cursos públicos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CommunityCourseCard
              key={course.id}
              course={course}
              currentUserId={session.user.id}
              userPlan={userPlan}
            />
          ))}
        </div>
      )}
    </div>
  );
}
