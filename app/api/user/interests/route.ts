import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log(
      'Interests API - Session:',
      session?.user?.id ? 'Authenticated' : 'Not authenticated'
    );

    if (!session?.user?.id) {
      console.log('Interests API - Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interests } = await request.json();
    console.log('Interests API - Received interests:', interests);

    if (!Array.isArray(interests)) {
      console.log(
        'Interests API - Invalid interests format:',
        typeof interests
      );
      return NextResponse.json(
        { error: 'Interests must be an array' },
        { status: 400 }
      );
    }

    // Update user interests in database
    console.log(
      'Interests API - Updating user interests for:',
      session.user.id
    );
    await db.user.update({
      where: { id: session.user.id },
      data: { interests: JSON.stringify(interests) },
    });

    console.log('Interests API - Successfully updated interests');
    return NextResponse.json({
      success: true,
      interests,
    });
  } catch (error) {
    console.error('Error updating user interests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log(
      'GET interests - Session:',
      session?.user?.id ? 'Authenticated' : 'Not authenticated'
    );

    if (!session?.user?.id) {
      console.log('GET interests - Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user interests from database
    console.log(
      'GET interests - Fetching interests for user:',
      session.user.id
    );
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { interests: true },
    });

    console.log('GET interests - User data:', user);

    const interests = user?.interests ? JSON.parse(user.interests) : [];
    console.log('GET interests - Parsed interests:', interests);

    return NextResponse.json({ interests });
  } catch (error) {
    console.error('Error fetching user interests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
