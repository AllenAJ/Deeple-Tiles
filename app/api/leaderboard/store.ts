import fs from 'fs';
import path from 'path';

export type PerfEntry = {
  account: string;
  score: number;
  accuracy: number;
  song: string;
  ts: number;
};

let store: PerfEntry[] = [];

const CACHE_PATH = path.join(process.cwd(), '.next-cache-leaderboard.json');

(function load() {
  if (fs.existsSync(CACHE_PATH)) {
    try { const raw = fs.readFileSync(CACHE_PATH, 'utf8'); store = JSON.parse(raw) as PerfEntry[]; } catch {}
  }
})();

function save() {
  try { fs.writeFileSync(CACHE_PATH, JSON.stringify(store.slice(-500)), 'utf8'); } catch {}
}

export function addPerf(entry: PerfEntry) {
  store.push(entry);
  save();
}

export function topPerfs(limit = 20) {
  return store
    .slice()
    .sort((a, b) => (b.score - a.score) || (b.accuracy - a.accuracy) || (b.ts - a.ts))
    .slice(0, limit);
} 