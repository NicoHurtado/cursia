import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wompiClient } from '@/lib/wompi';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { card } = body;

    if (!card || !card.number || !card.exp_month || !card.exp_year || !card.cvc || !card.name) {
      return NextResponse.json(
        { error: 'Missing required card information' },
        { status: 400 }
      );
    }

    // Create payment method token with Wompi
    const tokenResponse = await fetch(`${process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1'}/payment_sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        type: 'CARD',
        token: card.number,
        customer_email: session.user.email,
        acceptance_token: process.env.WOMPI_ACCEPTANCE_TOKEN,
        installments: 1,
        customer_email: session.user.email
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Wompi token creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create payment token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      token: tokenData.data.id,
      status: tokenData.data.status
    });
  } catch (error) {
    console.error('Create payment token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
