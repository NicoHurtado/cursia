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
  [UserPlan.FREE]: 'Plan de prueba',
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
  coursesStartedThisMonth: number
): boolean {
  const limits = getPlanLimits(userPlan);
  return coursesStartedThisMonth < limits.maxCoursesPerMonth;
}

export function getRemainingCourses(
  userPlan: UserPlan,
  coursesStartedThisMonth: number
): number {
  const limits = getPlanLimits(userPlan);
  return Math.max(0, limits.maxCoursesPerMonth - coursesStartedThisMonth);
}

// Plan hierarchy for upgrades/downgrades
export const PLAN_HIERARCHY: Record<UserPlan, number> = {
  [UserPlan.FREE]: 0,
  [UserPlan.APRENDIZ]: 1,
  [UserPlan.EXPERTO]: 2,
  [UserPlan.MAESTRO]: 3,
};

export function isUpgrade(currentPlan: UserPlan, newPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan];
}

export function isDowngrade(currentPlan: UserPlan, newPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[newPlan] < PLAN_HIERARCHY[currentPlan];
}

export function isSamePlan(currentPlan: UserPlan, newPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[currentPlan] === PLAN_HIERARCHY[newPlan];
}

export function canUpgrade(currentPlan: UserPlan, newPlan: UserPlan): boolean {
  return isUpgrade(currentPlan, newPlan);
}

export function canDowngrade(currentPlan: UserPlan, newPlan: UserPlan): boolean {
  // Allow downgrades only to FREE plan or if user explicitly wants to downgrade
  return newPlan === UserPlan.FREE || isDowngrade(currentPlan, newPlan);
}
