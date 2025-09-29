import { NextRequest, NextResponse } from 'next/server';
import {
  ContentContractValidator,
  ContentDocument,
} from '@/lib/content-contract';
import { contentStore } from '@/lib/content-store';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const doc = json as ContentDocument;

    const result = ContentContractValidator.validateDocument(doc);
    if (!result.isValid) {
      return NextResponse.json({ errors: result.errors }, { status: 422 });
    }

    contentStore.save(doc);
    return NextResponse.json(
      { ok: true, content_id: doc.content_id },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use /api/content-docs/[content_id]' },
    { status: 400 }
  );
}
