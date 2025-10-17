import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { UserPlan } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find cancelled subscriptions that have passed their next payment date
    const expiredSubscriptions = await db.subscription.findMany({
      where: {
        status: 'CANCELLED',
        nextPaymentDate: {
          lt: new Date(), // Next payment date is in the past
        },
      },
      include: {
        user: true,
      },
    });

    if (process.env.NODE_ENV !== 'production')
      console.log(
        `Found ${expiredSubscriptions.length} expired subscriptions to process`
      );

    // Downgrade users to FREE plan
    const userIds = expiredSubscriptions.map(sub => sub.userId);

    if (userIds.length > 0) {
      await db.user.updateMany({
        where: {
          id: {
            in: userIds,
          },
        },
        data: {
          plan: UserPlan.FREE,
        },
      });

      if (process.env.NODE_ENV !== 'production')
        console.log(`Downgraded ${userIds.length} users to FREE plan`);
    }

    return NextResponse.json({
      success: true,
      processed: expiredSubscriptions.length,
      message: `Processed ${expiredSubscriptions.length} expired subscriptions`,
    });
  } catch (error) {
    console.error('Error processing expired subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
