import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseWompiWebhook } from '@/lib/wompi';
import { UserPlan } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-wompi-signature') || '';

    // Parse and verify webhook
    const webhookEvent = parseWompiWebhook(body, signature);

    console.log('Wompi webhook received:', webhookEvent.event, webhookEvent.data);

    const { event, data } = webhookEvent;

    switch (event) {
      case 'transaction.created':
        await handleTransactionCreated(data);
        break;
      
      case 'transaction.updated':
        await handleTransactionUpdated(data);
        break;
      
      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleTransactionCreated(data: any) {
  const { transaction } = data;
  
  // Find subscription by reference
  const subscription = await db.subscription.findUnique({
    where: { reference: transaction.reference },
    include: { user: true }
  });

  if (!subscription) {
    console.log('Subscription not found for reference:', transaction.reference);
    return;
  }

  // Update subscription with payment info
  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      lastPaymentDate: new Date(transaction.created_at),
      status: transaction.status === 'APPROVED' ? 'ACTIVE' : 'FAILED'
    }
  });

  // If payment failed, downgrade user to FREE
  if (transaction.status !== 'APPROVED') {
    await db.user.update({
      where: { id: subscription.userId },
      data: { plan: UserPlan.FREE }
    });
  }
}

async function handleTransactionUpdated(data: any) {
  const { transaction } = data;
  
  const subscription = await db.subscription.findUnique({
    where: { reference: transaction.reference }
  });

  if (!subscription) {
    return;
  }

  // Update subscription status based on transaction status
  let newStatus = subscription.status;
  
  if (transaction.status === 'APPROVED') {
    newStatus = 'ACTIVE';
  } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED') {
    newStatus = 'FAILED';
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      lastPaymentDate: transaction.status === 'APPROVED' 
        ? new Date(transaction.created_at) 
        : subscription.lastPaymentDate
    }
  });

  // If payment failed, downgrade user to FREE
  if (transaction.status !== 'APPROVED') {
    await db.user.update({
      where: { id: subscription.userId },
      data: { plan: UserPlan.FREE }
    });
  }
}

async function handleSubscriptionCreated(data: any) {
  const { subscription } = data;
  
  const dbSubscription = await db.subscription.findUnique({
    where: { wompiSubscriptionId: subscription.id }
  });

  if (dbSubscription) {
    await db.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        nextPaymentDate: new Date(subscription.next_payment_date)
      }
    });
  }
}

async function handleSubscriptionUpdated(data: any) {
  const { subscription } = data;
  
  const dbSubscription = await db.subscription.findUnique({
    where: { wompiSubscriptionId: subscription.id }
  });

  if (dbSubscription) {
    await db.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        nextPaymentDate: new Date(subscription.next_payment_date)
      }
    });
  }
}

async function handleSubscriptionCancelled(data: any) {
  const { subscription } = data;
  
  const dbSubscription = await db.subscription.findUnique({
    where: { wompiSubscriptionId: subscription.id }
  });

  if (dbSubscription) {
    await db.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // Downgrade user to FREE plan
    await db.user.update({
      where: { id: dbSubscription.userId },
      data: { plan: UserPlan.FREE }
    });
  }
}
