export enum UserPlan {
  FREE = 'FREE',
  APRENDIZ = 'APRENDIZ',
  EXPERTO = 'EXPERTO',
  MAESTRO = 'MAESTRO',
}

export interface PlanLimits {
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
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  [UserPlan.FREE]: {
    maxCoursesPerMonth: 1,
    hasCommunityAccess: false,
    canPublishCourses: false,
    hasCustomProfiles: false,
    hasAdvancedAI: false,
    hasEmailSupport: false,
    hasPrioritySupport: false,
    hasVIPSupport: false,
    hasCustomDiplomas: false,
    hasPersonalizedInterests: false,
  },
  [UserPlan.APRENDIZ]: {
    maxCoursesPerMonth: 5,
    hasCommunityAccess: false,
    canPublishCourses: false,
    hasCustomProfiles: false,
    hasAdvancedAI: true,
    hasEmailSupport: true,
    hasPrioritySupport: false,
    hasVIPSupport: false,
    hasCustomDiplomas: true,
    hasPersonalizedInterests: true,
  },
  [UserPlan.EXPERTO]: {
    maxCoursesPerMonth: 10,
    hasCommunityAccess: true,
    canPublishCourses: false,
    hasCustomProfiles: false,
    hasAdvancedAI: true,
    hasEmailSupport: true,
    hasPrioritySupport: true,
    hasVIPSupport: false,
    hasCustomDiplomas: true,
    hasPersonalizedInterests: true,
  },
  [UserPlan.MAESTRO]: {
    maxCoursesPerMonth: 20,
    hasCommunityAccess: true,
    canPublishCourses: true,
    hasCustomProfiles: true,
    hasAdvancedAI: true,
    hasEmailSupport: true,
    hasPrioritySupport: true,
    hasVIPSupport: true,
    hasCustomDiplomas: true,
    hasPersonalizedInterests: true,
  },
};

export const PLAN_NAMES: Record<UserPlan, string> = {
  [UserPlan.FREE]: 'Plan Gratuito',
  [UserPlan.APRENDIZ]: 'Plan Aprendiz',
  [UserPlan.EXPERTO]: 'Plan Experto',
  [UserPlan.MAESTRO]: 'Plan Maestro',
};

export const PLAN_PRICES: Record<UserPlan, number> = {
  [UserPlan.FREE]: 0,
  [UserPlan.APRENDIZ]: 29900,
  [UserPlan.EXPERTO]: 49900,
  [UserPlan.MAESTRO]: 69900,
};

export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canCreateCourse(
  userPlan: UserPlan,
  coursesCreatedThisMonth: number
): boolean {
  const limits = getPlanLimits(userPlan);
  return coursesCreatedThisMonth < limits.maxCoursesPerMonth;
}

export function getRemainingCourses(
  userPlan: UserPlan,
  coursesCreatedThisMonth: number
): number {
  const limits = getPlanLimits(userPlan);
  return Math.max(0, limits.maxCoursesPerMonth - coursesCreatedThisMonth);
}
