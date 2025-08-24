import { NextRequest, NextResponse } from 'next/server';
import { GenerateSongRequest, GenerateSongResponse, ErrorResponse, MusicComposition, MusicNote } from '@/types';
import { generateMelodyFromPrompt } from '@/lib/music/gen';

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateFallback(bpm: number, difficulty: 'easy' | 'normal' | 'hard', seed: number): { bpm: number; notes: MusicNote[] } {
  const rand = prng(seed);
  const beatMs = 60000 / bpm;
  const lengthBeats = difficulty === 'easy' ? 32 : difficulty === 'normal' ? 48 : 64;
  const density = difficulty === 'easy' ? 0.6 : difficulty === 'normal' ? 0.9 : 1.2;

  const notes: MusicNote[] = [];
  let t = 0;
  for (let i = 0; i < lengthBeats; i++) {
    const hitsThisBeat = Math.max(1, Math.round(density + rand()));
    for (let h = 0; h < hitsThisBeat; h++) {
      const lane = Math.floor(rand() * 10);
      const key = lane === 9 ? 0 : lane + 1;
      const jitter = (rand() - 0.5) * 0.15 * beatMs;
      notes.push({ key, time: Math.max(0, Math.round(t + jitter)) });
    }
    t += beatMs;
  }
  notes.sort((a, b) => a.time - b.time);
  return { bpm, notes };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateSongRequest;
    const prompt = body.prompt?.slice(0, 256);
    const bpmReq = body.bpm && body.bpm > 40 && body.bpm < 220 ? Math.round(body.bpm) : 120;
    const difficulty = body.difficulty ?? 'easy';
    const seedBase = typeof body.seed === 'number' ? body.seed : (Date.now() % 1_000_000);
    const seed = Math.abs((seedBase + (prompt ? prompt.length * 97 : 0)) | 0);

    let bpm = bpmReq;
    let notes: MusicNote[] | null = null;

    if (prompt && process.env.OPENAI_API_KEY) {
      try {
        const comp = await generateMelodyFromPrompt(prompt, seed);
        bpm = comp.bpm || bpmReq;
        notes = comp.notes as MusicNote[];
      } catch {}
    }

    if (!notes) {
      const fb = generateFallback(bpmReq, difficulty, seed);
      bpm = fb.bpm; notes = fb.notes;
    }

    const composition: MusicComposition = {
      title: prompt ? `AI Jam - ${prompt}` : 'AI Jam',
      bpm,
      notes,
      prompt: prompt ?? undefined,
      seed,
    };

    const res: GenerateSongResponse = { success: true, composition };
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const res: ErrorResponse = { success: false, error: message };
    return NextResponse.json(res, { status: 400 });
  }
} 