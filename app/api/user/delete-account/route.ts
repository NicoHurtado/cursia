import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user-related data in the correct order (due to foreign key constraints)
    await db.$transaction(async tx => {
      // 1. Delete user progress
      await tx.userProgress.deleteMany({
        where: { userId },
      });

      // 2. Delete user's courses (if they own any)
      await tx.course.deleteMany({
        where: { userId },
      });

      // 3. Delete the user account
      await tx.user.delete({
        where: { id: userId },
      });
    });

    console.log(`✅ Account deleted successfully for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
