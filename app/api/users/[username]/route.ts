import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolved = await params;
    const username = resolved.username;

    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        plan: true,
        level: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const courses = await db.course.findMany({
      where: {
        userId: user.id,
        isPublic: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, plan: true },
        },
        _count: {
          select: { courseRatings: true },
        },
      },
    });

    // Métricas agregadas rápidas (sin promedio)
    const publicCourses = courses.length;
    const totalCompletions = courses.reduce(
      (acc, c) => acc + (c.totalCompletions || 0),
      0
    );
    const totalRatings = courses.reduce(
      (acc, c) => acc + (c.totalRatings || 0),
      0
    );

    return NextResponse.json({
      user,
      metrics: {
        publicCourses,
        totalCompletions,
        totalRatings,
      },
      courses,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
