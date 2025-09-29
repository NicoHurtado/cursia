'use client';

import { useState, useEffect } from 'react';
import { Crown, Star, Zap, CreditCard } from 'lucide-react';
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
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
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
    return null;
  }

  const Icon = planIcons[planData.currentPlan];
  const colorClass = planColors[planData.currentPlan];

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <div
            className={`w-6 h-6 ${colorClass} rounded flex items-center justify-center`}
          >
            <Icon className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium">{planData.planName}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {planData.usage.coursesStartedThisMonth}/
          {planData.limits.maxCoursesPerMonth}
        </span>
      </div>
    </div>
  );
}
