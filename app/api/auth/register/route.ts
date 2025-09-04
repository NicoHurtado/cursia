import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
