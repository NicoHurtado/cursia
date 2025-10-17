import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: subscriptionId } = await params;

    // Get subscription
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Subscription already cancelled' },
        { status: 400 }
      );
    }

    // For testing, skip Wompi cancellation since we're using mock subscriptions
    // In production, uncomment the line below:
    // await wompiClient.cancelSubscription(subscription.wompiSubscriptionId);

    // Update subscription in database - mark as cancelled but keep access until next payment date
    const updatedSubscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // DON'T downgrade user immediately - they keep access until the end of the paid period
    // The user will be downgraded when the next payment fails or when the subscription expires

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelledAt: updatedSubscription.cancelledAt,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
