'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { config as appConfig } from '@/lib/config';

const DEFAULT_DEEPLE_IMG = 'https://i.ibb.co/jkSNDZk2/sample-deepl-nft.png';

export default function ComposerPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [prompt, setPrompt] = useState('uplifting synthwave');
  const [loading, setLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([]);
  const [showNfts, setShowNfts] = useState(false);
  const [nfts, setNfts] = useState<Array<{ contract: string; tokenId: string; title: string; imageUrl: string | null }>>([]);
  const [comp, setComp] = useState<{ title: string; bpm: number; notes: { key: number; time: number }[] } | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(DEFAULT_DEEPLE_IMG);

  function push(role: 'assistant' | 'user', text: string) {
    setAiMessages((m) => [...m, { role, text }]);
  }

  async function handleGenerate(params?: { fromNft?: { contract: string; tokenId: string }, coverUrl?: string | null }) {
    try {
      setLoading(true);
      push('user', params?.fromNft ? `Generate from my NFT ${params.fromNft.contract}:${params.fromNft.tokenId}` : `Generate from prompt: ${prompt}`);
      push('assistant', 'Thinking about tempo, mood, and structure…');
      const body: any = { prompt, bpm: 120 };
      if (params?.fromNft) body.fromNft = params.fromNft;
      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      push('assistant', 'Generating melody and mapping notes to lanes…');
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to generate');
      setComp({ title: data?.composition?.title || 'Generated Song', bpm: data?.composition?.bpm || 120, notes: data?.composition?.notes || [] });
      if (params?.coverUrl) setCoverUrl(params.coverUrl);
      push('assistant', `Done! ${data?.composition?.notes?.length || 0} notes @ ${data?.composition?.bpm || 120} BPM.`);
    } catch (e: any) {
      push('assistant', `Failed: ${e?.message || 'Unknown error'}`);
      alert('Failed to generate song');
    } finally {
      setLoading(false);
      setShowNfts(false);
    }
  }

  async function loadMyNfts() {
    if (!address) return;
    try {
      if (!appConfig.deepleNftAddress) {
        alert('Deeple Tiles contract address is not configured');
        return;
      }
      setShowNfts(true);
      const q = new URLSearchParams({ owner: address });
      const res = await fetch(`/api/nfts?${q.toString()}`);
      const data = await res.json();
      if (data?.success) {
        const target = appConfig.deepleNftAddress.toLowerCase();
        const onlyDeeples = (data.nfts || []).filter((n: any) => (n.contract || '').toLowerCase() === target);
        setNfts(onlyDeeples);
      }
    } catch {}
  }

  function saveAndReturn() {
    if (!comp) return;
    localStorage.setItem('generatedComposition', JSON.stringify({ ...comp, coverUrl }));
    router.push('/game');
  }

  async function mintThisCard() {
    try {
      if (!comp || !address) {
        alert('Connect wallet and generate a song first');
        return;
      }
      const provider = (window as any).ethereum;
      if (!provider?.request) {
        alert('No wallet provider found');
        return;
      }
      const songData = { title: comp.title, bpm: comp.bpm, notes: comp.notes.map(n=>n.key).slice(0, 64), ts: Date.now() };
      const dataMsg = `MINT_SONG:${JSON.stringify(songData)}`;
      const SHAPE_SEPOLIA = { chainId: '0x2AF3' } as const;
      const dataHex = '0x' + [...new TextEncoder().encode(dataMsg)].map((b) => b.toString(16).padStart(2, '0')).join('');
      const tx: any = {
        from: address,
        to: '0x000000000000000000000000000000000000dEaD',
        value: '0x0',
        data: dataHex,
        chainId: SHAPE_SEPOLIA.chainId,
      };
      try {
        const estimatedGas = await provider.request({ method: 'eth_estimateGas', params: [tx] });
        tx.gas = estimatedGas;
      } catch (_) {}
      const txHash = await provider.request({ method: 'eth_sendTransaction', params: [tx] });
      alert(`Mint transaction sent!\nHash: ${txHash}`);
    } catch (err: any) {
      alert(`Mint failed: ${err?.message || 'Unknown error'}`);
      console.error(err);
    }
  }

  function discardCard() {
    setComp(null);
    setCoverUrl(null);
  }

  const previewNotes = comp?.notes?.map((n) => n.key).slice(0, 14) || [];
  const coverIndex = ((comp?.title?.length || 0) % 6) + 1;

  return (
    <section className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">AI Composer</h2>
        <p className="text-sm text-muted-foreground">Enter a prompt or derive from one of your NFTs. Generate a melody, preview it as a card, then save and return to play.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Mood or genre (e.g., dreamy lofi)"
          className="select"
          style={{ minWidth: 320 }}
        />
        <Button onClick={() => handleGenerate()} disabled={loading}>
          {loading ? 'Generating…' : 'Generate song'}
        </Button>
        {isConnected && (
          <Button onClick={loadMyNfts} disabled={loading}>
            Use my NFTs
          </Button>
        )}
      </div>

      {showNfts && (
        <div className="rounded-lg border bg-card text-card-foreground p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Select a Deeple Tiles NFT</div>
            <Button variant="ghost" size="sm" onClick={() => setShowNfts(false)}>Close</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {nfts.length === 0 ? (
              <div className="col-span-2 text-sm text-muted-foreground">No Deeple Tiles NFTs found for this wallet.</div>
            ) : (
              nfts.map((n) => (
                <button
                  key={`${n.contract}:${n.tokenId}`}
                  type="button"
                  onClick={() => handleGenerate({ fromNft: { contract: n.contract, tokenId: n.tokenId }, coverUrl: 'https://i.ibb.co/jkSNDZk2/sample-deepl-nft.png' })}
                  className="text-left rounded-md border hover:shadow-sm transition overflow-hidden"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img src={DEFAULT_DEEPLE_IMG} alt={n.title || 'NFT'} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-medium truncate">Deeple 001</div>
                    <div className="text-[10px] text-muted-foreground truncate">{n.contract.slice(0,10)}…#{n.tokenId}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card text-card-foreground">
        <div className="p-4 space-y-2 max-h-56 overflow-auto">
          {aiMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No generation yet. Enter a prompt and click Generate.</p>) : (
            aiMessages.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium mr-1">{m.role === 'user' ? 'You' : 'AI'}</span>
                <span className="text-muted-foreground">{m.text}</span>
              </div>
            ))
          )}
          {loading && (
            <div className="text-sm text-muted-foreground">Processing…</div>
          )}
        </div>
      </div>

      {comp && (
        <div className="flex items-center gap-4">
          <div className="card holo-card w-[220px]" data-rarity="rare holo galaxy" tabIndex={0}>
            <div className="card__translater">
              <div className="card__rotator">
                <div className="card__front relative">
                  <img src={`/cards/placeholder-card-featured.png`} alt={comp.title} className="block w-full h-auto rounded-xl shadow-[rgba(0,0,0,0.25)_0px_18px_36px_-12px]" />
                  <div className="card__shine" />
                  <div className="card__glare" />
                  <span className="card-title" style={{ position: 'absolute', top: '5.5%', right: '40%', left: '12%', zIndex: 10, fontSize: 'clamp(0.6rem, 5cqw, 1rem)' }}>{'Deeple 001'}</span>
                  <span className="card-title" style={{ position: 'absolute', top: '66%', right: '24.5%', left: '11.5%', zIndex: 10, fontSize: 'clamp(0.4rem, 6cqw, 0.8rem)', lineHeight: 1.1 as any }}>[ {previewNotes.join(', ')} ]</span>
                  <img alt="cover" loading="lazy" width={1000} height={1000} decoding="async" style={{ position: 'absolute', top: '13.7%', left: '12%', height: '42.5%', width: '76%', objectFit: 'cover' }} src={coverUrl || DEFAULT_DEEPLE_IMG} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={mintThisCard}>Mint this card</Button>
            <Button variant="secondary" onClick={saveAndReturn}>Play this card</Button>
            <Button variant="ghost" onClick={discardCard}>Discard</Button>
          </div>
        </div>
      )}
    </section>
  );
} 