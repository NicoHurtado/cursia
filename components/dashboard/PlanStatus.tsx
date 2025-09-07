'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Star,
  Zap,
  CreditCard,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { UserPlan, PLAN_NAMES, PLAN_PRICES } from '@/lib/plans';
import { useRouter } from 'next/navigation';

interface PlanStatusProps {
  className?: string;
}

interface PlanData {
  currentPlan: UserPlan;
  planName: string;
  planPrice: number;
  limits: {
    maxCoursesPerMonth: number;
    hasCommunityAccess: boolean;
    canPublishCourses: boolean;
    hasCustomProfiles: boolean;
    hasAdvancedAI: boolean;
    hasEmailSupport: boolean;
    hasPrioritySupport: boolean;
    hasVIPSupport: boolean;
    hasCustomDiplomas: boolean;
    hasPersonalizedInterests: boolean;
  };
  usage: {
    coursesCreatedThisMonth: number;
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
  const router = useRouter();

  useEffect(() => {
    fetchPlanData();
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

  const handleUpgrade = () => {
    router.push('/dashboard/plans');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!planData) {
    return null;
  }

  const Icon = planIcons[planData.currentPlan];
  const colorClass = planColors[planData.currentPlan];

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{planData.planName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {planData.planPrice > 0
                  ? `$${planData.planPrice.toLocaleString()}/mes`
                  : 'Gratuito'}
              </p>
            </div>
          </div>
          {planData.currentPlan !== UserPlan.MAESTRO && (
            <Button onClick={handleUpgrade} size="sm" variant="outline">
              Actualizar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cursos este mes</span>
            <Badge
              variant={
                planData.usage.canCreateCourse ? 'default' : 'destructive'
              }
            >
              {planData.usage.coursesCreatedThisMonth}/
              {planData.limits.maxCoursesPerMonth}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                planData.usage.canCreateCourse ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, (planData.usage.coursesCreatedThisMonth / planData.limits.maxCoursesPerMonth) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {planData.usage.remainingCourses} cursos restantes
          </p>
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Características incluidas:</h4>
          <div className="grid grid-cols-1 gap-1">
            {planData.limits.hasAdvancedAI && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>IA Avanzada</span>
              </div>
            )}
            {planData.limits.hasCustomDiplomas && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Diplomas Personalizados</span>
              </div>
            )}
            {planData.limits.hasPersonalizedInterests && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Gustos Personalizados</span>
              </div>
            )}
            {planData.limits.hasCommunityAccess && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Acceso a Comunidad</span>
              </div>
            )}
            {planData.limits.canPublishCourses && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Publicar Cursos</span>
              </div>
            )}
            {planData.limits.hasCustomProfiles && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Perfiles Personalizados</span>
              </div>
            )}
          </div>
        </div>

        {/* Support Level */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span>Soporte:</span>
            <span className="text-muted-foreground">
              {planData.limits.hasVIPSupport
                ? 'VIP'
                : planData.limits.hasPrioritySupport
                  ? 'Prioritario'
                  : planData.limits.hasEmailSupport
                    ? 'Email'
                    : 'Básico'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
