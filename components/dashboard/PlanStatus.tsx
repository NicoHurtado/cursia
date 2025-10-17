'use client';

import { Crown, Star, Zap, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { UserPlan } from '@/lib/plans';

interface PlanStatusProps {
  className?: string;
}

interface PlanData {
  currentPlan: UserPlan;
  planName: string;
  limits: {
    maxCoursesPerMonth: number;
  };
  usage: {
    coursesStartedThisMonth: number;
    remainingCourses: number;
    canCreateCourse: boolean;
  };
}

const planIcons = {
  [UserPlan.FREE]: CreditCard,
  [UserPlan.APRENDIZ]: Star,
  [UserPlan.EXPERTO]: Zap,
  [UserPlan.MAESTRO]: Crown,
};

const planColors = {
  [UserPlan.FREE]: 'bg-gray-500',
  [UserPlan.APRENDIZ]: 'bg-blue-500',
  [UserPlan.EXPERTO]: 'bg-purple-500',
  [UserPlan.MAESTRO]: 'bg-amber-500',
};

export function PlanStatus({ className }: PlanStatusProps) {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPlanData();
  }, []);

  // Refresh data when page becomes visible (user returns from course)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPlanData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchPlanData = async () => {
    try {
      const response = await fetch('/api/user/plan');
      if (response.ok) {
        const data = await response.json();
        setPlanData(data);
        setError(null);
      } else if (response.status === 401) {
        setError('Debes iniciar sesión para ver tu plan.');
      } else {
        const err = await response.json().catch(() => ({}) as any);
        setError(err.error || 'No se pudo cargar el plan.');
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
      setError('No se pudo cargar el plan.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className={className}>
        {error ? (
          <div className="text-sm text-muted-foreground">{error}</div>
        ) : null}
      </div>
    );
  }

  const Icon = planIcons[planData.currentPlan];
  const colorClass = planColors[planData.currentPlan];

  const used = planData.usage.coursesStartedThisMonth;
  const max = planData.limits.maxCoursesPerMonth;
  const percent = Math.min(100, Math.round((used / Math.max(1, max)) * 100));

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="flex items-center space-x-2">
          <div
            className={`w-6 h-6 ${colorClass} rounded flex items-center justify-center`}
          >
            <Icon className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium">{planData.planName}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {used}/{max}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {planData.usage.canCreateCourse
          ? `Te quedan ${planData.usage.remainingCourses} curso(s) este mes`
          : 'Has alcanzado tu límite mensual'}
      </div>
      {!planData.usage.canCreateCourse && (
        <div className="mt-3">
          <Button
            size="sm"
            onClick={() => router.push('/dashboard/plans')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Actualizar plan
          </Button>
        </div>
      )}
    </div>
  );
}
