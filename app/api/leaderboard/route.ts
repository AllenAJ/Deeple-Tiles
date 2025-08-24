import { NextRequest, NextResponse } from 'next/server';
import { topPerfs, addPerf } from './store';

export async function GET() {
  return NextResponse.json({ success: true, items: topPerfs(50) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account, perf } = body || {};
    if (!account || !perf?.score || typeof perf.accuracy !== 'number' || !perf.song || !perf.ts) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
    addPerf({ account, score: perf.score, accuracy: perf.accuracy, song: perf.song, ts: perf.ts });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 