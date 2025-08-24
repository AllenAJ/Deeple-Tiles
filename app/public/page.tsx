import Link from 'next/link';
import { readPublications } from '@/app/api/publications/store';
import CardsGrid from './cards-grid';
import { config as appConfig } from '@/lib/config';

export default async function PublicPage() {
  const items = readPublications().sort((a, b) => b.ts - a.ts);
  const contract = appConfig.deepleNftAddress || '0xC5CB2cdD2A2dBF6090a30407189701BB24e6318F';
  return (
    <section className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Published Deeples</h2>
        <p className="text-sm text-muted-foreground">Cards shared by the community.</p>
      </div>
      <CardsGrid items={items} contract={contract} />
      <div>
        <Link href="/game" className="underline text-sm">Back to Game</Link>
      </div>
    </section>
  );
} 