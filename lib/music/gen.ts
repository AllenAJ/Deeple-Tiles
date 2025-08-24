import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const Note = z.object({ key: z.number().int().min(0).max(9), time: z.number().int().min(0) });
const Composition = z.object({ bpm: z.number().int().min(60).max(200), notes: z.array(Note).min(8) });
export type GenResult = z.infer<typeof Composition>;

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const modelName = process.env.MUSIC_MODEL || 'gpt-4o-mini';

const FEWSHOT = `
Available example songs and patterns (JSON only examples):
- "happy-birthday": {"bpm":120,"notes":[{"key":1,"time":0},{"key":1,"time":500},{"key":3,"time":1000},{"key":1,"time":1500},{"key":5,"time":2000},{"key":1,"time":2500},{"key":6,"time":3000}]}
- "ode-to-joy": {"bpm":120,"notes":[{"key":5,"time":0},{"key":5,"time":500},{"key":6,"time":1000},{"key":8,"time":1500},{"key":8,"time":2000},{"key":6,"time":2500},{"key":5,"time":3000},{"key":3,"time":3500}]}
- "come-as-you-are": (riff) {"bpm":120,"notes":[{"key":1,"time":0},{"key":1,"time":500},{"key":2,"time":1000},{"key":3,"time":1500},{"key":6,"time":2000},{"key":3,"time":2500},{"key":6,"time":3000},{"key":3,"time":3500}]}
`;

export async function generateMelodyFromPrompt(prompt: string, seed?: number): Promise<GenResult> {
  const sys = `You are a melody generator for a 10-lane rhythm game with keys 1-9 and 0.
Return strict JSON { bpm:number, notes:{key:0-9,time:ms}[] } only.
Use 32-96 beats total. Avoid duplicate timestamps. Keep times ascending.
If the prompt contains a style hint like style: <name>, emulate that example's rhythmic/interval character while making a new melody.
${FEWSHOT}`;
  const user = `Prompt: ${prompt}. Output only JSON.`;
  try {
    const res = await generateText({
      model: openai.chat(modelName),
      system: sys,
      prompt: user,
      temperature: 0.6,
    });
    const text = res.text.trim();
    const jsonStart = text.indexOf('{');
    const jsonStr = jsonStart >= 0 ? text.slice(jsonStart) : text;
    const parsed = Composition.parse(JSON.parse(jsonStr));
    parsed.notes.sort((a, b) => a.time - b.time);
    return parsed;
  } catch {
    // Fall back to deterministic pseudo melody when AI generation fails or is unavailable
    const s = (seed ?? Date.now()) >>> 0;
    let x = s;
    function rnd() { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 0xffffffff; }
    const bpm = 120;
    const beat = Math.round(60000 / bpm);
    const len = 48 + Math.floor(rnd() * 24);
    const notes: { key: number; time: number }[] = [];
    let t = 0;
    for (let i = 0; i < len; i++) {
      const hits = 1 + (rnd() > 0.85 ? 1 : 0);
      for (let h = 0; h < hits; h++) {
        const lane = Math.floor(rnd() * 10);
        const key = lane === 9 ? 0 : lane + 1;
        const jitter = Math.round((rnd() - 0.5) * 0.15 * beat);
        notes.push({ key, time: Math.max(0, t + jitter) });
      }
      t += beat;
    }
    notes.sort((a, b) => a.time - b.time);
    return { bpm, notes };
  }
} 