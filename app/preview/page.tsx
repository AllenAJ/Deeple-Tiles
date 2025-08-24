"use client";
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const DEFAULT_DEEPLE_IMG = 'https://i.ibb.co/jkSNDZk2/sample-deepl-nft.png';
const NOTES = [1, 2, 3, 5, 8, 3, 2, 1];

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

export default function PreviewPage() {
  useEffect(() => attachHoloOnce(document), []);
  useEffect(() => {
    const header = document.querySelector('header') as HTMLElement | null;
    const footer = document.querySelector('footer') as HTMLElement | null;
    const prevH = header?.style.display || '';
    const prevF = footer?.style.display || '';
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = prevH;
      if (footer) footer.style.display = prevF;
    };
  }, []);

  function playThis() {
    const comp = {
      title: 'Deeple 001',
      bpm: 120,
      notes: NOTES.map((k, i) => ({ key: k, time: i * 500 })),
      coverUrl: DEFAULT_DEEPLE_IMG,
    };
    localStorage.setItem('generatedComposition', JSON.stringify(comp));
    window.location.href = '/game';
  }

  return (
    <div>
      <div className="w-full max-w-[240px] mx-auto">
        <div className="card holo-card w-[220px]" data-rarity="rare holo galaxy" tabIndex={0}>
          <div className="card__translater">
            <div className="card__rotator">
              <div className="card__front relative">
                <img src={"/cards/placeholder-card-featured.png"} alt={'Deeple 001'} className="block w-full h-auto rounded-xl shadow-[rgba(0,0,0,0.25)_0px_18px_36px_-12px]" />
                <div className="card__shine" />
                <div className="card__glare" />
                <span className="card-title" style={{ position: 'absolute', top: '5.5%', right: '40%', left: '12%', zIndex: 10, fontSize: 'clamp(0.6rem, 5cqw, 1rem)' }}>{'Deeple 001'}</span>
                <span className="card-title" style={{ position: 'absolute', top: '66%', right: '24.5%', left: '11.5%', zIndex: 10, fontSize: 'clamp(0.4rem, 6cqw, 0.8rem)', lineHeight: 1.1 as any }}>[ {NOTES.join(', ')} ]</span>
                <img alt="cover" loading="lazy" width={1000} height={1000} decoding="async" style={{ position: 'absolute', top: '13.7%', left: '12%', height: '42.5%', width: '76%', objectFit: 'cover' }} src={DEFAULT_DEEPLE_IMG} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center">
          <Button onClick={playThis}>Play</Button>
        </div>
      </div>
    </div>
  );
} 