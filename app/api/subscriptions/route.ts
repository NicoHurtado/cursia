import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPlan } from '@/lib/plans';
import {
  wompiClient,
  getPlanPriceInCents,
  createSubscriptionReference,
} from '@/lib/wompi';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug: Check if db.subscription exists
    console.log('DB object keys:', Object.keys(db));
    console.log('Subscription model exists:', !!db.subscription);
    console.log('Subscription model type:', typeof db.subscription);

    if (!db.subscription) {
      console.error('db.subscription is undefined!');
      return NextResponse.json(
        { error: 'Database subscription model not available' },
        { status: 500 }
      );
    }

    // Get user's active subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['ACTIVE', 'PAUSED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        amountInCents: subscription.amountInCents,
        currency: subscription.currency,
        nextPaymentDate: subscription.nextPaymentDate,
        lastPaymentDate: subscription.lastPaymentDate,
        createdAt: subscription.createdAt,
        cancelledAt: subscription.cancelledAt,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
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
    const { plan, paymentMethodToken } = body;

    // Validate plan
    const validPlans = Object.values(UserPlan);
    if (!validPlans.includes(plan) || plan === UserPlan.FREE) {
      return NextResponse.json(
        { error: 'Invalid plan for subscription' },
        { status: 400 }
      );
    }

    // Debug: Check if db.subscription exists in POST method
    console.log('POST - DB object keys:', Object.keys(db));
    console.log('POST - Subscription model exists:', !!db.subscription);

    if (!db.subscription) {
      console.error('POST - db.subscription is undefined!');
      return NextResponse.json(
        { error: 'Database subscription model not available' },
        { status: 500 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['ACTIVE', 'PAUSED'],
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare subscription data
    const amountInCents = getPlanPriceInCents(plan);
    const reference = createSubscriptionReference(session.user.id, plan);

    // Create subscription in Wompi
    let wompiSubscription;
    try {
      wompiSubscription = await wompiClient.createSubscription({
        customer_email: user.email,
        amount_in_cents: amountInCents,
        currency: 'COP',
        reference,
        payment_method: {
          type: 'CARD',
          token: paymentMethodToken,
        },
        recurring_period: {
          interval: 'MONTHLY',
          interval_count: 1,
        },
      });

      console.log('✅ Wompi subscription created:', wompiSubscription.id);
    } catch (wompiError: any) {
      console.error('❌ Wompi subscription creation failed:', wompiError);
      return NextResponse.json(
        {
          error: 'No se pudo crear la suscripción en el procesador de pagos.',
          details: wompiError.message,
        },
        { status: 400 }
      );
    }

    // Save subscription to database
    const subscription = await db.subscription.create({
      data: {
        userId: session.user.id,
        wompiSubscriptionId: wompiSubscription.id,
        plan,
        amountInCents,
        currency: 'COP',
        reference,
        paymentMethodToken, // Guardar el token para futuros pagos
        nextPaymentDate: new Date(wompiSubscription.next_payment_date),
        status: wompiSubscription.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    // Update user plan
    await db.user.update({
      where: { id: session.user.id },
      data: { plan },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        amountInCents: subscription.amountInCents,
        nextPaymentDate: subscription.nextPaymentDate,
      },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
