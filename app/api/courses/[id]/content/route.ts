import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = contentStore.getByCourseId(id);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(doc, { status: 200 });
}



