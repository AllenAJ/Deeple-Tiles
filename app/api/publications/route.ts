import { NextRequest, NextResponse } from 'next/server';
import { readPublications, writePublications, Publication } from './store';

export async function GET() {
  const items = readPublications().sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, notes, score, accuracy, ts } = body || {};
    if (!title || !Array.isArray(notes)) return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    const id = Math.random().toString(36).slice(2);
    const items = readPublications();
    const creator = req.headers.get('x-account') || undefined;
    items.push({ id, title, notes, score: Number(score)||0, accuracy: Number(accuracy)||0, ts: Number(ts)||Date.now(), creator } as Publication);
    writePublications(items);
    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
} 