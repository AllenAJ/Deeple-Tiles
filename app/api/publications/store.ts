import fs from 'fs';
import path from 'path';

export type Publication = { id: string; title: string; notes: number[]; score: number; accuracy: number; ts: number; creator?: string };

const FILE = path.join(process.cwd(), 'cache', 'publications.json');

export function readPublications(): Publication[] {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writePublications(items: Publication[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
} 