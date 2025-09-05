import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan, PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with current plan
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count courses created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const coursesThisMonth = await db.course.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
        },
        deletedAt: null,
      },
    });

    const planLimits = PLAN_LIMITS[user.plan as UserPlan];
    const remainingCourses = Math.max(0, planLimits.maxCoursesPerMonth - coursesThisMonth);

    return NextResponse.json({
      currentPlan: user.plan,
      planName: PLAN_NAMES[user.plan as UserPlan],
      planPrice: PLAN_PRICES[user.plan as UserPlan],
      limits: planLimits,
      usage: {
        coursesCreatedThisMonth: coursesThisMonth,
        remainingCourses,
        canCreateCourse: remainingCourses > 0,
      },
    });
  } catch (error) {
    console.error('Get user plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    console.log('Received plan update request:', { userId: session.user.id, plan });

    // Validate plan
    const validPlans = Object.values(UserPlan);
    if (!validPlans.includes(plan)) {
      console.error('Invalid plan:', plan, 'Valid plans:', validPlans);
      return NextResponse.json(
        { error: `Invalid plan. Valid plans are: ${validPlans.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, plan: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Updating user plan from', existingUser.plan, 'to', plan);

    // Update user plan
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { plan },
      select: {
        plan: true,
      },
    });

    const planLimits = PLAN_LIMITS[plan as UserPlan];

    console.log('Plan updated successfully:', updatedUser.plan);

    return NextResponse.json({
      success: true,
      message: `Plan actualizado a ${PLAN_NAMES[plan as UserPlan]}`,
      plan: updatedUser.plan,
      planName: PLAN_NAMES[plan as UserPlan],
      planPrice: PLAN_PRICES[plan as UserPlan],
      limits: planLimits,
    });
  } catch (error) {
    console.error('Update user plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
