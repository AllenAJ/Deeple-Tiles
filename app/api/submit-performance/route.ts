import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Expected: { perf: {...}, signature: string, account: string }
    if (!body?.perf || !body?.signature || !body?.account) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
    // Store for leaderboard (best-effort)
    try {
      const { addPerf } = await import('../leaderboard/store');
      const { perf, account } = body;
      addPerf({ account, score: perf.score, accuracy: perf.accuracy, song: perf.song, ts: perf.ts });
    } catch {}
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 