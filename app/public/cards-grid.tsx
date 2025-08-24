"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const DEFAULT_DEEPLE_IMG = 'https://i.ibb.co/jkSNDZk2/sample-deepl-nft.png';

export type PubItem = { id: string; title: string; notes: number[]; ts: number; creator?: string };

function attachHoloOnce(root: HTMLElement | Document = document) {
  const cards = Array.from(root.querySelectorAll('.holo-card')) as HTMLElement[];
  for (const card of cards) {
    if ((card as any)._holoInit) continue;
    (card as any)._holoInit = true;
    const handle = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const py = Math.max(0, Math.min(100, (y / rect.height) * 100));
      const rx = ((py - 50) / 50) * -10;
      const ry = ((px - 50) / 50) * 10;
      const dx = px - 50;
      const dy = py - 50;
      const hyp = Math.min(1.2, Math.hypot(dx, dy) / 70);
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.style.setProperty('--posx', `${px}%`);
      card.style.setProperty('--posy', `${py}%`);
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
      card.style.setProperty('--hyp', `${hyp}`);
      card.style.setProperty('--o', `1`);
    };
    card.addEventListener('pointermove', handle);
    card.addEventListener('pointerenter', () => card.classList.add('active'));
    card.addEventListener('pointerleave', () => {
      card.classList.remove('active');
      card.style.setProperty('--o', `0`);
      card.style.setProperty('--rx', `0deg`);
      card.style.setProperty('--ry', `0deg`);
    });
  }
}

function compress(addr: string) {
  const a = addr || '';
  if (a.length <= 8) return a;
  const start = a.slice(0, 4);
  const end = a.slice(-3).toUpperCase();
  return `${start}.....${end}`;
}

async function payAndPlay(item: PubItem, router: ReturnType<typeof useRouter>) {
  try {
    const provider = (window as any).ethereum;
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const from = accounts?.[0];
    const to = item.creator || from;
    // 0.00001 ETH in wei
    const value = '0x9184E72A000';
    await provider.request({ method: 'eth_sendTransaction', params: [{ from, to, value }] });
    localStorage.setItem('generatedComposition', JSON.stringify({ title: item.title, bpm: 120, notes: item.notes.map((k, i)=>({ key: k, time: i*500 })), coverUrl: DEFAULT_DEEPLE_IMG }));
    router.push('/game');
  } catch (e) {
    alert('Payment failed or cancelled');
  }
}

export default function CardsGrid({ items, contract }: { items: PubItem[]; contract: string }) {
  const router = useRouter();
  useEffect(() => {
    attachHoloOnce(document);
  }, [items]);

  const title = compress(contract);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 justify-items-center">
      {items.map((it) => (
        <div key={it.id} className="w-full max-w-[240px] mx-auto">
          <div className="card holo-card w-[220px]" data-rarity="rare holo galaxy" tabIndex={0}>
            <div className="card__translater">
              <div className="card__rotator">
                <div className="card__front relative">
                  <img src={"/cards/placeholder-card-featured.png"} alt={title} className="block w-full h-auto rounded-xl shadow-[rgba(0,0,0,0.25)_0px_18px_36px_-12px]" />
                  <div className="card__shine" />
                  <div className="card__glare" />
                  <span className="card-title" style={{ position: 'absolute', top: '5.5%', right: '40%', left: '12%', zIndex: 10, fontSize: 'clamp(0.6rem, 5cqw, 1rem)' }}>{title}</span>
                  <span className="card-title" style={{ position: 'absolute', top: '66%', right: '24.5%', left: '11.5%', zIndex: 10, fontSize: 'clamp(0.4rem, 6cqw, 0.8rem)', lineHeight: 1.1 as any }}>[ {Array.isArray(it.notes) ? it.notes.join(', ') : ''} ]</span>
                  <img alt="cover" loading="lazy" width={1000} height={1000} decoding="async" style={{ position: 'absolute', top: '13.7%', left: '12%', height: '42.5%', width: '76%', objectFit: 'cover' }} src={DEFAULT_DEEPLE_IMG} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <Button size="sm" onClick={() => payAndPlay(it, router)}>Pay 0.00001 and play</Button>
          </div>
        </div>
      ))}
    </div>
  );
} 