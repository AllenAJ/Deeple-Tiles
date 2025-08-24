'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element, react/no-unescaped-entities */

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select as UiSelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { config as appConfig } from '@/lib/config';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import { shapeSepolia } from 'viem/chains';

const SONG_LABELS: Record<string, string> = {
  'random': 'Random Notes',
  'happy-birthday': 'Happy Birthday to You',
  'ode-to-joy': 'Ode to Joy - Beethoven',
  
  'come-as-you-are': 'Come as You Are ',
  'baby-shark': 'Baby Shark',
  'mary-lamb': 'Mary Had A Little Lamb',
  'twinkle-twinkle': 'Twinkle Twinkle',
};

export default function GamePage() {
  const { address, connector, isConnected } = useAccount();
  const [prompt, setPrompt] = useState('uplifting synthwave');
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<Array<{contract: string; tokenId: string; title: string; imageUrl: string | null}>>([]);
  const [showNfts, setShowNfts] = useState(false);
  const [selectedSong, setSelectedSong] = useState('random');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'system' | 'assistant' | 'user'; text: string }>>([]);
  const [showGenConfirm, setShowGenConfirm] = useState(false);
  const [genSummary, setGenSummary] = useState<{ title: string; bpm: number; length: number } | null>(null);
  const [genCard, setGenCard] = useState<{ title: string; notes: number[]; coverIndex: number } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy'|'normal'|'hard'>('easy');
  const [songCards, setSongCards] = useState<Array<{ id: string; title: string; notes: number[] }>>([]);

  useEffect(() => {
    // Apply difficulty parameters
    const g = (window as any)._game as any;
    if (!g) return;
    if (selectedDifficulty === 'hard') {
      g.noteSpeed = 2.9; g.spawnInterval = 780; g.difficultyName = 'Hard';
    } else if (selectedDifficulty === 'normal') {
      g.noteSpeed = 3.2; g.spawnInterval = 880; g.difficultyName = 'Normal';
    } else {
      g.noteSpeed = 3.6; g.spawnInterval = 980; g.difficultyName = 'Easy';
    }
    const diffEl = document.getElementById('difficulty');
    if (diffEl) diffEl.textContent = g.difficultyName;
  }, [selectedDifficulty]);

  function showOnlyDom(id: 'landing' | 'select' | 'game') {
    ['landing','select','game'].forEach(i => document.getElementById(i)?.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
  }

  function pushMsg(role: 'system' | 'assistant' | 'user', text: string) {
    setAiMessages((m) => [...m, { role, text }]);
  }

  // Ensure newly rendered holo cards get interactions
  function attachHoloToCards() {
    const cards = Array.from(document.querySelectorAll('.holo-card')) as HTMLElement[];
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

  async function loadMyNfts() {
    if (!address) return;
    try {
      setShowNfts(true);
      const q = new URLSearchParams({ owner: address });
      const res = await fetch(`/api/nfts?${q.toString()}`);
      const data = await res.json();
      if (data?.success) setNfts(data.nfts);
    } catch {}
  }

  async function handleGenerate(params?: { fromNft?: { contract: string; tokenId: string } }) {
    try {
      setLoading(true);
      pushMsg('user', params?.fromNft ? `Generate from my NFT ${params.fromNft.contract}:${params.fromNft.tokenId}` : `Generate from prompt: ${prompt}`);
      pushMsg('assistant', 'Thinking about tempo, mood, and structure…');
      const body: any = { prompt, difficulty: selectedDifficulty, bpm: 120 };
      if (params?.fromNft) body.fromNft = params.fromNft;
      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      pushMsg('assistant', 'Generating melody and mapping notes to lanes…');
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to generate');
      const comp = data.composition as { bpm: number; notes: { key: number; time: number }[]; title?: string };
      pushMsg('assistant', `Done! ${comp.notes.length} notes @ ${comp.bpm} BPM.`);
      if ((window as any)._game) {
        const g = (window as any)._game;
        g.songPatterns = g.songPatterns || {};
        g.songPatterns['generated'] = comp.notes;
        g.currentSong = 'generated';
        const label = document.getElementById('current-song');
        if (label) label.textContent = comp.title || 'Generated Song';
        const select = document.getElementById('song-select') as HTMLSelectElement | null;
        if (select) {
          if (!Array.from(select.options).some(o => o.value === 'generated')) {
            const opt = document.createElement('option');
            opt.value = 'generated';
            opt.text = 'Generated Song';
            select.appendChild(opt);
          }
          select.value = 'generated';
        }
      }
      setSelectedSong('generated');
      setGenSummary({ title: data?.composition?.title || 'Generated Song', bpm: data?.composition?.bpm || 120, length: data?.composition?.notes?.length || 0 });
      const previewNotes = (data?.composition?.notes || []).map((n: any) => n.key).slice(0, 14);
      setGenCard({ title: data?.composition?.title || 'Generated Song', notes: previewNotes, coverIndex: Math.floor(Math.random() * 6) + 1 });
      setShowGenConfirm(true);
    } catch (e: any) {
      console.error(e);
      pushMsg('assistant', `Failed: ${e?.message || 'Unknown error'}`);
      alert('Failed to generate song');
    } finally {
      setLoading(false);
      setShowNfts(false);
    }
  }

  function handlePlayGenerated() {
    const g = (window as any)._game;
    if (g) {
      g.currentSong = 'generated';
    }
    setShowGenConfirm(false);
    setGenSummary(null);
    showOnlyDom('game');
    if (g) g.start();
  }

  async function mintGeneratedSong() {
    try {
      const provider = (window as any)._bongoProvider;
      const account = (window as any)._bongoAccount;
      if (!provider || !account || !genCard || !genSummary) {
        alert('Connect wallet and generate a song first');
        return;
      }
      const songData = {
        title: genCard.title,
        bpm: genSummary.bpm,
        notes: genCard.notes,
        ts: Date.now(),
      };
      const dataMsg = `MINT_SONG:${JSON.stringify(songData)}`;
      const SHAPE_SEPOLIA = { chainId: '0x2AF3' } as const;
      const dataHex = '0x' + [...new TextEncoder().encode(dataMsg)].map((b) => b.toString(16).padStart(2, '0')).join('');
      const tx: any = {
        from: account,
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

  async function mintStarterDeeple() {
    try {
      const account = (window as any)._bongoAccount as `0x${string}` | undefined;
      const provider = (window as any)._bongoProvider;
      if (!account || !provider) {
        alert('Connect wallet first');
        return;
      }
      const contract = appConfig.deepleNftAddress as `0x${string}` | undefined;
      if (!contract) {
        alert('NEXT_PUBLIC_DEEPLE_NFT_ADDRESS not configured');
        return;
      }
      // Minimal ERC721 mint(to, tokenURI) selector: function mint(address to, string memory uri)
      const fnSelector = 'mint(address,string)';
      const tokenURI = JSON.stringify({ name: 'deeple 001', image: 'https://i.ibb.co/jkSNDZk2/sample-deepl-nft.png' });
      const data = encodeFunctionData({ abi: [{ type: 'function', name: 'mint', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'uri', type: 'string' }], outputs: [] }], functionName: 'mint', args: [account, tokenURI] });

      const tx: any = { from: account, to: contract, data, value: '0x0', chainId: shapeSepolia.id };
      try {
        const gas = await provider.request({ method: 'eth_estimateGas', params: [tx] });
        tx.gas = gas;
      } catch (_) {}
      const txHash = await provider.request({ method: 'eth_sendTransaction', params: [tx] });
      alert(`Mint sent!\nHash: ${txHash}`);
    } catch (err: any) {
      alert(`Mint failed: ${err?.message || 'Unknown error'}`);
    }
  }

  function handleDiscardGenerated() {
    setShowGenConfirm(false);
    setGenSummary(null);
  }

  useEffect(() => {
    let cancelled = false;
    async function bridgeProvider() {
      try {
        if (connector && isConnected) {
          const prov = await connector.getProvider();
          if (!cancelled) {
            (window as any)._bongoProvider = prov;
            (window as any)._bongoAccount = address;
            const game = (window as any)._game;
            if (game) {
              game.provider = (window as any)._bongoProvider;
              game.account = (window as any)._bongoAccount;
            }
          }
        }
      } catch (_) {}
    }
    bridgeProvider();
    return () => {
      cancelled = true;
    };
  }, [connector, address, isConnected]);

  useEffect(() => {
    // ===== Utilities =====
    const SHAPE_SEPOLIA = {
      chainId: '0x2AF3',
      rpcUrls: ['https://sepolia.shape.network'],
      blockExplorerUrls: ['https://explorer-sepolia.shape.network/'],
    };

    const Screens = {
      landing: document.getElementById('landing'),
      select: document.getElementById('select'),
      game: document.getElementById('game'),
      over: document.getElementById('game-over'),
    } as const;

    function showOnly(id: keyof typeof Screens) {
      Object.values(Screens).forEach((el) => el?.classList.add('hidden'));
      Screens[id]?.classList.remove('hidden');
    }

    class BongoCatGame {
      head: HTMLElement | null;
      pawL: HTMLElement | null;
      pawR: HTMLElement | null;
      kb: HTMLElement | null;
      scoreEl: HTMLElement | null;
      accEl: HTMLElement | null;
      songLabel: HTMLElement | null;

      noteSpeed: number;
      perfectWindow: number;

      notes: any[];
      gameRunning: boolean;
      songNoteIndex: number;
      onchain: boolean;
      score: number;
      hits: number;
      misses: number;
      currentSong: string;
      hitNotes: any[];
      autoPlay: boolean;
      // Adaptive difficulty state
      spawnInterval: number;
      difficultyName: string;

      account: string | null;
      provider: any;
      injected: any;

      sounds: Record<string, HTMLAudioElement>;
      songPatterns: Record<string, { key: number; time: number }[]>;
      lastSpawn?: number;
      gameStart?: number;
      songEndTime?: number;

      constructor() {
        this.head = document.getElementById('head');
        this.pawL = document.getElementById('paw-left');
        this.pawR = document.getElementById('paw-right');
        this.kb = document.getElementById('keyboard');
        this.scoreEl = document.getElementById('score');
        this.accEl = document.getElementById('accuracy');
        this.songLabel = document.getElementById('current-song');

        this.noteSpeed = 3.2;
        this.perfectWindow = 0.25;

        this.notes = [];
        this.gameRunning = false;
        this.songNoteIndex = 0;
        this.onchain = true;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.currentSong = 'random';
        this.hitNotes = [];
        this.autoPlay = false;
        // Fixed difficulty defaults; updated by selector
        this.spawnInterval = 900;
        this.difficultyName = 'Easy';

        this.account = (window as any)._bongoAccount ?? null;
        this.provider = (window as any)._bongoProvider ?? null;
        this.injected = (typeof window !== 'undefined' && (window as any).ethereum) || null;

        this.sounds = {};
        this.initSounds();
        this.songPatterns = {} as any;
        this.initSongs();

        this.initUI();
        this.initInputs();
      }

      initUI() {
        const playBtn = document.getElementById('goto-select') as HTMLButtonElement | null;
        const backBtn = document.getElementById('back-home') as HTMLButtonElement | null;
        const startBtn = document.getElementById('start-game') as HTMLButtonElement | null;
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;
        const quitBtn = document.getElementById('quit-btn') as HTMLButtonElement | null;

        playBtn?.addEventListener('click', () => showOnlyDom('select'));
        backBtn?.addEventListener('click', () => showOnly('landing'));
        startBtn?.addEventListener('click', () => this.startFromSelect());
        pauseBtn?.addEventListener('click', () => this.pause());
        quitBtn?.addEventListener('click', () => this.quitToMenu());

        document.getElementById('play-again')?.addEventListener('click', () => {
          const over = document.getElementById('game-over');
          if (over) (over as any).style.display = 'none';
          showOnlyDom('select');
        });
        document.getElementById('to-menu')?.addEventListener('click', () => {
          const over = document.getElementById('game-over');
          if (over) (over as any).style.display = 'none';
          showOnly('landing');
        });
        document.getElementById('publish-run')?.addEventListener('click', () => this.publishRun());
        document.getElementById('share-run')?.addEventListener('click', () => this.shareRun());

        const songSelect = document.getElementById('song-select') as HTMLSelectElement | null;
        songSelect?.addEventListener('change', (e: any) => {
          this.currentSong = e.target.value;
        });
        const signBtn = document.getElementById('sign-performance');
        signBtn?.addEventListener('click', () => this.signPerformance());
      }

      initInputs() {
        document.addEventListener('keydown', (e) => {
          const key = e.key.toLowerCase();
          if (e.ctrlKey && key === 'a') {
            e.preventDefault();
            this.autoPlay = !this.autoPlay;
            this.showAutoPlayStatus();
            return;
          }
          if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(key)) {
            this.animateCat(key);
            this.kb?.classList.add('keyboard-press');
            setTimeout(() => this.kb?.classList.remove('keyboard-press'), 120);
            if (this.gameRunning) {
              this.playSound(key);
              this.hitNote(parseInt(key, 10));
            }
          }
        });
      }

      async sendBatchTransaction() {
        if (!this.onchain || !this.provider || !this.account || this.hitNotes.length === 0) {
          return;
        }

        const gameData = {
          gameEnd: Date.now(),
          totalScore: this.score,
          accuracy: (this.hits / (this.hits + this.misses)) * 100,
          hitNotes: this.hitNotes,
          song: this.currentSong,
        };

        const dataMsg = `BONGO_GAME:${JSON.stringify(gameData)}`;
        const confirmed = window.confirm(
          `Send transaction to Shape Sepolia Testnet?\n\n` +
            `Final Score: ${this.score}\n` +
            `Accuracy: ${Math.round(gameData.accuracy)}%\n` +
            `Notes Hit: ${this.hitNotes.length}\n` +
            `Song: ${this.currentSong}\n\n` +
            `This will send a transaction to Shape Sepolia Testnet with your game data.\n\n` +
            `⚠️ Transaction is required to complete the game.`
        );
        if (!confirmed) return;

        try {
          const dataHex =
            '0x' + [...new TextEncoder().encode(dataMsg)].map((b) => b.toString(16).padStart(2, '0')).join('');

          const [gasPrice, nonce] = await Promise.all([
            this.provider.request({ method: 'eth_gasPrice' }),
            this.provider.request({ method: 'eth_getTransactionCount', params: [this.account, 'latest'] }),
          ]);

          const tx: any = {
            from: this.account,
            to: '0x000000000000000000000000000000000000dEaD',
            value: '0x0',
            data: dataHex,
            chainId: SHAPE_SEPOLIA.chainId,
            gasPrice,
            nonce,
            gas: '0x186A0',
          };

          try {
            const estimatedGas = await this.provider.request({ method: 'eth_estimateGas', params: [tx] });
            tx.gas = estimatedGas;
          } catch (_) {}

          const txHash = await this.provider.request({ method: 'eth_sendTransaction', params: [tx] });
          window.alert(
            `Transaction sent to Shape Sepolia Testnet!\n\n` +
              `Hash: ${txHash}\n` +
              `Score: ${this.score}\n` +
              `Notes: ${this.hitNotes.length}\n` +
              `Song: ${this.currentSong}\n\n` +
              `View on explorer: ${SHAPE_SEPOLIA.blockExplorerUrls[0]}/tx/${txHash}`
          );
        } catch (err: any) {
          let errorMsg = 'Transaction failed';
          if (err?.code === 4001) errorMsg = 'Transaction rejected by user';
          else if (err?.code === -32603) errorMsg = "Network error - check if you're on Shape Sepolia Testnet";
          else if (err?.message) errorMsg = err.message;

          try {
            const simpleTx = {
              from: this.account,
              to: '0x000000000000000000000000000000000000dEaD',
              value: '0x1',
              chainId: SHAPE_SEPOLIA.chainId,
            };
            const txHash = await this.provider.request({ method: 'eth_sendTransaction', params: [simpleTx] });
            window.alert(
              `Simple transaction sent to Shape Sepolia Testnet!\n\n` +
                `Hash: ${txHash}\n` +
                `Score: ${this.score}\n` +
                `Notes: ${this.hitNotes.length}\n` +
                `Song: ${this.currentSong}\n\n` +
                `View on explorer: ${SHAPE_SEPOLIA.blockExplorerUrls[0]}/tx/${txHash}\n\n` +
                `Note: Game data was not included due to network limitations.`
            );
          } catch (simpleErr) {
            try {
              const signature = await this.provider.request({ method: 'personal_sign', params: [dataMsg, this.account] });
              window.alert(
                `Transaction failed: ${errorMsg}\n\nGame data signed instead:\nSignature: ${signature}\nScore: ${this.score}\nNotes: ${this.hitNotes.length}`
              );
            } catch (_) {
              window.alert(`Transaction failed: ${errorMsg}\n\nSigning also failed. Check console for details.`);
            }
          }
        }
      }

      initSounds() {
        const files: Record<string, string> = {
          '1': 'keyboard1.mp3',
          '2': 'keyboard2.mp3',
          '3': 'keyboard3.mp3',
          '4': 'keyboard4.mp3',
          '5': 'keyboard5.mp3',
          '6': 'keyboard6.mp3',
          '7': 'keyboard7.mp3',
          '8': 'keyboard8.mp3',
          '9': 'keyboard9.mp3',
          '0': 'keyboard0.mp3',
        };
        for (const [k, f] of Object.entries(files)) {
          const a = new Audio(`/bongo/sound/${f}`);
          a.volume = 0.35;
          a.preload = 'auto';
          this.sounds[k] = a;
        }
      }

      playSound(k: string) {
        const a = this.sounds[k];
        if (!a) return;
        a.currentTime = 0;
        a.play().catch(() => {});
      }

      initSongs() {
        const build = (groups: string[], step = 500, gap = 400) => {
          let t = 0;
          const arr: any[] = [];
          for (const g of groups) {
            for (const ch of g) {
              if (/\d/.test(ch)) {
                arr.push({ key: +ch, time: t });
                t += step;
              }
            }
            t += gap;
          }
          return arr;
        };
        this.songPatterns = {
          'happy-birthday': build(['113165', '113186', '11087643', '009575']),
          'ode-to-joy': [
            { key: 5, time: 0 },
            { key: 5, time: 500 },
            { key: 6, time: 1000 },
            { key: 8, time: 1500 },
            { key: 8, time: 2000 },
            { key: 6, time: 2500 },
            { key: 5, time: 3000 },
            { key: 3, time: 3500 },
            { key: 1, time: 4000 },
            { key: 1, time: 4500 },
            { key: 3, time: 5000 },
            { key: 5, time: 5500 },
            { key: 5, time: 6000 },
            { key: 3, time: 6500 },
            { key: 3, time: 7000 },
          ],
          'come-as-you-are': [
            { key: 1, time: 0 },
            { key: 1, time: 500 },
            { key: 2, time: 1000 },
            { key: 3, time: 1500 },
            { key: 6, time: 2000 },
            { key: 3, time: 2500 },
            { key: 6, time: 3000 },
            { key: 3, time: 3500 },
          ],
          // Baby Shark: "136666666 136666666 136666666 665"
          'baby-shark': [
            { key: 1, time: 0 },
            { key: 3, time: 500 },
            { key: 6, time: 1000 },
            { key: 6, time: 1500 },
            { key: 6, time: 2000 },
            { key: 6, time: 2500 },
            { key: 6, time: 3000 },
            { key: 6, time: 3500 },
            { key: 6, time: 4000 },
            { key: 1, time: 4500 },
            { key: 3, time: 5000 },
            { key: 6, time: 5500 },
            { key: 6, time: 6000 },
            { key: 6, time: 6500 },
            { key: 6, time: 7000 },
            { key: 6, time: 7500 },
            { key: 6, time: 8000 },
            { key: 6, time: 8500 },
            { key: 6, time: 9000 },
            { key: 1, time: 9500 },
            { key: 3, time: 10000 },
            { key: 6, time: 10500 },
            { key: 6, time: 11000 },
            { key: 6, time: 11500 },
            { key: 6, time: 12000 },
            { key: 6, time: 12500 },
            { key: 6, time: 13000 },
            { key: 6, time: 13500 },
            { key: 6, time: 14000 },
            { key: 6, time: 14500 },
            { key: 6, time: 15000 },
            { key: 6, time: 15500 },
            { key: 5, time: 16000 },
          ],
          // Mary Had A Little Lamb
          'mary-lamb': [
            { key: 7, time: 0 },
            { key: 5, time: 500 },
            { key: 3, time: 1000 },
            { key: 5, time: 1500 },
            { key: 7, time: 2000 },
            { key: 7, time: 2500 },
            { key: 7, time: 3000 },
            { key: 5, time: 3500 },
            { key: 5, time: 4000 },
            { key: 5, time: 4500 },
            { key: 7, time: 5000 },
            { key: 0, time: 5500 },
            { key: 0, time: 6000 },
            { key: 7, time: 6500 },
            { key: 5, time: 7000 },
            { key: 3, time: 7500 },
            { key: 5, time: 8000 },
            { key: 7, time: 8500 },
            { key: 7, time: 9000 },
            { key: 7, time: 9500 },
            { key: 5, time: 10000 },
            { key: 5, time: 10500 },
            { key: 7, time: 11000 },
            { key: 5, time: 11500 },
            { key: 3, time: 12000 },
          ],
          // Twinkle Twinkle
          'twinkle-twinkle': [
            { key: 1, time: 0 },
            { key: 1, time: 500 },
            { key: 8, time: 1000 },
            { key: 8, time: 1500 },
            { key: 0, time: 2000 },
            { key: 0, time: 2500 },
            { key: 8, time: 3000 },
            { key: 6, time: 3500 },
            { key: 6, time: 4000 },
            { key: 5, time: 4500 },
            { key: 5, time: 5000 },
            { key: 3, time: 5500 },
            { key: 3, time: 6000 },
            { key: 1, time: 6500 },
            { key: 8, time: 7000 },
            { key: 8, time: 7500 },
            { key: 6, time: 8000 },
            { key: 6, time: 8500 },
            { key: 5, time: 9000 },
            { key: 5, time: 9500 },
            { key: 3, time: 10000 },
            { key: 3, time: 10500 },
            { key: 1, time: 11000 },
            { key: 8, time: 11500 },
            { key: 8, time: 12000 },
            { key: 6, time: 12500 },
            { key: 6, time: 13000 },
            { key: 5, time: 13500 },
            { key: 5, time: 14000 },
            { key: 3, time: 14500 },
            { key: 3, time: 15000 },
            { key: 1, time: 15500 },
            { key: 1, time: 16000 },
            { key: 1, time: 16500 },
            { key: 8, time: 17000 },
            { key: 8, time: 17500 },
            { key: 0, time: 18000 },
            { key: 0, time: 18500 },
            { key: 8, time: 19000 },
            { key: 6, time: 19500 },
            { key: 6, time: 20000 },
            { key: 5, time: 20500 },
            { key: 3, time: 21000 },
            { key: 8, time: 21500 },
            { key: 1, time: 22000 },
          ],
        };
      }

      startFromSelect() {
        const select = document.getElementById('song-select') as HTMLSelectElement | null;
        if (select) {
          this.currentSong = select.value;
          const label = document.querySelector('#song-select option:checked') as HTMLOptionElement | null;
          if (label && this.songLabel) this.songLabel.textContent = label.textContent ?? '';
        }
        showOnly('game');
        this.start();
      }

      start() {
        this.reset();
        this.gameRunning = true;
        this.gameStart = Date.now();
        this.songNoteIndex = 0;
        const pat = this.songPatterns[this.currentSong];
        this.songEndTime = this.currentSong === 'random' ? 30000 : ((pat?.[pat.length - 1]?.time || 0) + this.noteSpeed * 1000 + 1200);
        this.loop();
      }

      pause() {
        this.gameRunning = false;
      }
      quitToMenu() {
        this.gameRunning = false;
        showOnly('landing');
      }

      reset() {
        this.notes = [];
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.hitNotes = [];
        this.updateHUD();
        document.querySelectorAll('.note').forEach((n) => n.remove());
        const diffEl = document.getElementById('difficulty');
        if (diffEl) diffEl.textContent = this.difficultyName;
      }

      loop() {
        if (!this.gameRunning) return;
        const now = Date.now();
        const elapsed = now - (this.gameStart || now);

        if (this.currentSong === 'random') {
          if (!this.lastSpawn || now - this.lastSpawn > this.spawnInterval) {
            this.spawnRandom();
            this.lastSpawn = now;
          }
        } else this.spawnFromPattern(elapsed);

        this.updateNotes();

        if (this.autoPlay) this.autoPlayNotes();

        this.checkMisses();

        if ((this.songEndTime || 0) <= elapsed && this.notes.length === 0) {
          this.gameRunning = false;
          this.showOver();
          return;
        }
        requestAnimationFrame(() => this.loop());
      }

      spawnRandom() {
        const lane = Math.floor(Math.random() * 10);
        const key = lane === 9 ? 0 : lane + 1;
        this.createNote(lane, key);
      }
      spawnFromPattern(t: number) {
        const pat = this.songPatterns[this.currentSong];
        if (!pat) return;
        while (this.songNoteIndex < pat.length && pat[this.songNoteIndex].time <= t) {
          const n = pat[this.songNoteIndex++];
          const lane = n.key === 0 ? 9 : n.key - 1;
          this.createNote(lane, n.key);
        }
      }

      createNote(lane: number, key: number) {
        const el = document.createElement('div');
        el.className = 'note';
        (el as any).textContent = String(key);
        (el as any).dataset.lane = lane;
        (el as any).dataset.key = key;
        el.addEventListener('click', () => {
          if (this.gameRunning && !(el.classList.contains('hit') || el.classList.contains('miss'))) {
            this.playSound(String(key));
            this.hitNote(Number(key));
          }
        });
        document.querySelector(`.note-lane:nth-child(${lane + 1})`)?.appendChild(el);
        this.notes.push({ el, lane, key, t: Date.now() });
      }

      updateNotes() {
        const dur = this.noteSpeed * 1000;
        this.notes = this.notes.filter((n) => {
          const pr = (Date.now() - n.t) / dur;
          if (pr >= 1) {
            if (!n.hit && !n.missed) {
              n.missed = true;
              this.misses++;
              this.updateHUD();
            }
            n.el.remove();
            return false;
          }
          const y = -20 + pr * (100 - -20);
          (n.el as HTMLElement).style.top = y + 'px';
          return true;
        });
      }

      checkMisses() {
        const dur = this.noteSpeed * 1000;
        for (const n of this.notes) {
          const pr = (Date.now() - n.t) / dur;
          if (!n.missed && !n.hit && pr > 1.0) {
            n.missed = true;
            n.el.classList.add('miss');
            this.misses++;
            setTimeout(() => n.el.remove(), 200);
            this.updateHUD();
          }
        }
      }

      async hitNote(key: number) {
        const lane = key === 0 ? 9 : key - 1;
        const n = this.notes.find((x) => x.lane === lane && !x.hit && !x.missed);
        if (!n) return;

        const dur = this.noteSpeed * 1000;
        const pr = (Date.now() - n.t) / dur;
        const delta = Math.abs(1 - pr);

        if (delta <= this.perfectWindow) {
          n.hit = true;
          n.el.classList.add('perfect');
          this.hits++;
          this.score += 1;
          this.showScorePopup(n.el, '+1');
          if (this.hits > 1 && this.hits % 5 === 0) this.showCombo(this.hits);
          this.updateHUD();
          setTimeout(() => n.el.remove(), 200);
          if (this.onchain) {
            this.hitNotes.push({ key, timestamp: Date.now(), score: this.score });
          }
        }
      }

      updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = String(this.score);
        const total = this.hits + this.misses;
        const acc = total > 0 ? Math.round((this.hits / total) * 100) : 100;
        if (this.accEl) this.accEl.textContent = acc + '%';
      }

      showOver() {
        const finalScore = document.getElementById('final-score');
        if (finalScore) finalScore.textContent = String(this.score);
        const total = this.hits + this.misses;
        const acc = total ? Math.round((this.hits / total) * 100) : 100;
        const finalAcc = document.getElementById('final-accuracy');
        if (finalAcc) finalAcc.textContent = acc + '%';

        if (this.onchain && this.hitNotes.length > 0) {
          this.sendBatchTransaction().catch(() => {
            window.alert('Failed to send transaction');
          });
        }
        const over = document.getElementById('game-over');
        if (over) (over as any).style.display = 'flex';
      }

      async signPerformance() {
        try {
          if (!this.provider || !this.account) {
            alert('Connect wallet first');
            return;
          }
          const total = this.hits + this.misses;
          const accuracy = total ? Math.round((this.hits / total) * 100) : 100;
          const perf = {
            song: this.currentSong,
            score: this.score,
            accuracy,
            hits: this.hits,
            misses: this.misses,
            ts: Date.now(),
          };
          const msg = `DEEPL_PERF:${JSON.stringify(perf)}`;
          const sig = await this.provider.request({ method: 'personal_sign', params: [msg, this.account] });
          try {
            const res = await fetch('/api/submit-performance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ perf, signature: sig, account: this.account }),
            });
            const data = await res.json();
            if (!data?.success) throw new Error(data?.error || 'Submit failed');
            alert('Performance signed and submitted!');
          } catch (subErr) {
            console.error(subErr);
            alert('Signed but submit failed');
          }
        } catch (e: any) {
          alert('Failed to sign performance');
          console.error(e);
        }
      }

      animateCat(k: string) {
        if (['1', '2', '3', '4', '5', '6'].includes(k)) this.showLeft();
        else this.showRight();
      }
      showIdle() {
        if (this.pawL) this.pawL.style.opacity = '0';
        if (this.pawR) this.pawR.style.opacity = '0';
        if (this.head) this.head.style.opacity = '1';
      }
      showLeft() {
        if (this.pawL) this.pawL.style.opacity = '1';
        if (this.pawR) this.pawR.style.opacity = '0';
        if (this.head) this.head.style.opacity = '0';
      }
      showRight() {
        if (this.pawL) this.pawL.style.opacity = '0';
        if (this.pawR) this.pawR.style.opacity = '1';
        if (this.head) this.head.style.opacity = '0';
      }

      showScorePopup(element: any, text: string) {
        const rect = element.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        (popup as HTMLElement).style.left = rect.left + 'px';
        (popup as HTMLElement).style.top = rect.top + 'px';
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
      }

      showCombo(count: number) {
        const comboEl = document.getElementById('combo-display');
        if (!comboEl) return;
        comboEl.textContent = `${count} COMBO!`;
        comboEl.classList.add('show');
        setTimeout(() => comboEl.classList.remove('show'), 1000);
      }

      showAutoPlayStatus() {
        const comboEl = document.getElementById('combo-display');
        if (!comboEl) return;
        comboEl.textContent = this.autoPlay ? 'AUTO-PLAY ON' : 'AUTO-PLAY OFF';
        comboEl.classList.add('show');
        setTimeout(() => comboEl.classList.remove('show'), 1500);
      }

      autoPlayNotes() {
        const dur = this.noteSpeed * 1000;
        for (const note of this.notes) {
          if (!note.hit && !note.missed) {
            const pr = (Date.now() - note.t) / dur;
            if (pr >= 0.95 && pr <= 1.05) {
              this.playSound(String(note.key));
              this.hitNote(note.key);
              setTimeout(() => this.animateCat(String(note.key)), Math.random() * 100);
            }
          }
        }
      }

      async publishRun() {
        try {
          const payload = {
            title: this.songLabel?.textContent || 'Deeple 001',
            notes: (this.hitNotes || []).map((n: any) => n.key),
            score: this.score,
            accuracy: this.hits + this.misses ? Math.round((this.hits / (this.hits + this.misses)) * 100) : 100,
            ts: Date.now(),
          };
          const headers: any = { 'Content-Type': 'application/json' };
          if (this.account) headers['x-account'] = this.account;
          const res = await fetch('/api/publications', { method: 'POST', headers, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!data?.success) throw new Error(data?.error || 'Publish failed');
          window.location.href = '/public';
        } catch (e: any) { alert('Publish failed'); console.error(e); }
      }

      async shareRun() {
        try {
          const url = window.location.origin + '/public';
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard: ' + url);
        } catch { alert('Failed to copy link'); }
      }
    }

    function initHeroInteractions() {
      const panel = document.getElementById('hero-panel');
      const light = document.getElementById('hero-light');
      if (!panel || !light) return;
      panel.addEventListener('mousemove', (e: any) => {
        const rect = panel.getBoundingClientRect();
        (light as any).style.setProperty('--mx', e.clientX - rect.left + 'px');
        (light as any).style.setProperty('--my', e.clientY - rect.top + 'px');
        light.classList.add('show');
      });
      panel.addEventListener('mouseleave', () => light.classList.remove('show'));
    }

    function initHoloCard() {
      const cards = Array.from(document.querySelectorAll('.holo-card')) as HTMLElement[];
      if (cards.length === 0) return;
      for (const card of cards) {
        const handle = (e: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
          const py = Math.max(0, Math.min(100, (y / rect.height) * 100));
          const rx = ((py - 50) / 50) * -10; // tilt X
          const ry = ((px - 50) / 50) * 10; // tilt Y
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

    initHeroInteractions();
    initHoloCard();
    (window as any)._game = new BongoCatGame();
    // Load any generated composition from composer page
    try {
      const stored = localStorage.getItem('generatedComposition');
      if (stored) {
        const comp = JSON.parse(stored) as { title?: string; bpm?: number; notes?: { key: number; time: number }[]; coverUrl?: string | null };
        const g = (window as any)._game as any;
        if (g && comp?.notes?.length) {
          g.songPatterns = g.songPatterns || {};
          g.songPatterns['generated'] = comp.notes;
          const select = document.getElementById('song-select') as HTMLSelectElement | null;
          if (select && !Array.from(select.options).some(o => o.value==='generated')) {
            const opt = document.createElement('option');
            opt.value = 'generated';
            opt.text = 'Generated Song';
            select.appendChild(opt);
          }
          if (select) {
            select.value = 'generated';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const label = document.getElementById('current-song');
          if (label) label.textContent = comp.title || 'Generated Song';
          setSelectedSong('generated');
          // Apply custom cover to the featured card if present
          if (comp.coverUrl) {
            const coverImg = document.querySelector('#holo-card .card__front img[alt="Preview"]') as HTMLImageElement | null;
            if (coverImg) coverImg.src = comp.coverUrl;
          }
          // Auto-start the game with the generated song
          g.currentSong = 'generated';
          showOnlyDom('game');
          g.start();
        }
        localStorage.removeItem('generatedComposition');
      }
    } catch {}
  }, []);

  // Populate song cards from the game patterns after initialization
  useEffect(() => {
    const syncSongs = () => {
      const g = (window as any)._game as any;
      if (!g || !g.songPatterns) return;
      const entries = Object.entries(g.songPatterns) as [string, { key: number; time: number }[]][];
      const cards = entries
        .filter(([id]) => !!SONG_LABELS[id as keyof typeof SONG_LABELS])
        .map(([id, arr]) => ({ id, title: SONG_LABELS[id] || id, notes: arr.map((n) => n.key).slice(0, 14) }));
      setSongCards(cards);
    };
    const t = setTimeout(syncSongs, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    attachHoloToCards();
  }, [songCards]);

  return (
    <>
      <section className="container mx-auto px-4 py-8" id="landing">

      <section className="grid gap-7 items-center md:grid-cols-2 md:gap-10">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">Play rhythm challenges, or generate with AI</h1>
          <p className="text-muted-foreground mb-4">Connect your wallet, pick a classic or let the AI compose a new melody for you. Then tap the tiles in time.</p>
          <div className="flex items-center gap-3">
            <Button id="goto-select" disabled={!isConnected}>Start Playing</Button>
            <Button variant="secondary" onClick={()=>showOnlyDom('select')}>Choose Song</Button>
            <Button variant="outline" onClick={mintStarterDeeple}>Get your first Deeple</Button>
          </div>
        </div>
        <div className="relative aspect-square w-full max-w-[820px] mx-auto rounded-xl p-4 bg-[radial-gradient(circle_at_center,#B2C0D4,#C7D1DE)]">
                  <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ background: 'radial-gradient(closest-side at 50% 40%, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)', mixBlendMode: 'screen', opacity: 0.7 }} />
            <div className="back-preview absolute inset-auto z-0 w-1/2 translate-x-[40%] rotate-[12deg] scale-[0.85] drop-shadow-lg">
              <img src="/cards/placeholder-card-back.png" alt="Preview back" />
            </div>
            <div id="holo-card" className="card holo-card w-[230px] relative z-10" data-rarity="rare holo galaxy" tabIndex={0}>
              <div className="card__translater">
                <div className="card__rotator">
                  <div className="card__front">
                    <img src="/cards/placeholder-card-featured.png" alt="Preview" />
                    <div className="card__shine" />
                    <div className="card__glare" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Cards Showcase (Landing-only) */}
        <div className="col-span-full md:col-span-2 order-last mt-12">
          <h3 className="text-base font-bold font-large mb-2 text-center">Featured Cards</h3>
          <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-4 items-start justify-items-center">
            {(songCards.length ? songCards : [
              { id: 'happy-birthday', title: 'Happy Birthday to You', notes: [1,1,3,1,5,1] },
              { id: 'ode-to-joy', title: 'Ode to Joy - Beethoven', notes: [5,5,6,8,8,6,5,3,1,1,3,5] },
              { id: 'mary-lamb', title: 'Mary Had A Little Lamb', notes: [7,5,3,5,7,7,7] },
            ]).map((s, idx) => (
              <div key={s.id + idx} className="relative w-full max-w-[240px] mx-auto">
                <div className="relative" style={{ containerType: 'inline-size', transformStyle: 'preserve-3d' }}>
                  <div className={`card holo-card ${idx % 2 === 0 ? '-rotate-2' : 'rotate-2'} transition-transform`} data-rarity="rare holo galaxy" tabIndex={0}>
                    <div className="card__translater">
                      <div className="card__rotator">
                        <div className="card__front relative">
                          <img alt="Card" loading="lazy" width={1000} height={1000} decoding="async" className="block w-full h-auto rounded-xl shadow-[rgba(0,0,0,0.25)_0px_18px_36px_-12px]" src="/cards/placeholder-card-featured.png" />
                          <div className="card__shine" />
                          <div className="card__glare" />
                          <span className="card-title" style={{ position: 'absolute', top: '5.5%', right: '40%', left: '12%', zIndex: 10, fontSize: 'clamp(0.7rem, 12cqw, 1.2rem)' }}>{s.title.slice(0, 10)}</span>
                          <span className="card-title" style={{ position: 'absolute', top: '57.7%', right: '20%', left: '18%', zIndex: 10, fontSize: 'clamp(0.65rem, 8cqw, 1.1rem)', fontStyle: 'italic' }}>{s.title.slice(0, 10)}</span>
                          <span className="card-title" style={{ position: 'absolute', top: '66%', right: '24.5%', left: '11.5%', zIndex: 10, fontSize: 'clamp(0.4rem, 6cqw, 0.8rem)', lineHeight: 1.1 as any }}>[ {s.notes.join(', ')} ]</span>
                          <img alt="cover" loading="lazy" width={1000} height={1000} decoding="async" style={{ position: 'absolute', top: '13.7%', left: '12%', height: '42.5%', width: '76%', objectFit: 'cover' }} src={`/cards/card_img/${(idx % 6) + 1}.png`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      </section>

          <section id="select" className="container mx-auto px-4 py-8 hidden">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Choose Music</h2>
            <p className="text-sm text-muted-foreground">Pick a preset or compose a new song with AI. Select a difficulty, then start.</p>
          </div>
          <div className="grid gap-6">
            {/* Left: Presets & Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Label htmlFor="difficulty-select-ui" className="text-sm">Difficulty</Label>
                  <UiSelect value={selectedDifficulty} onValueChange={(v)=>{ const vv = v as 'easy'|'normal'|'hard'; setSelectedDifficulty(vv); const el=document.getElementById('difficulty-select') as HTMLSelectElement|null; if(el){ el.value=vv; el.dispatchEvent(new Event('change', { bubbles: true })); } }}>
                    <SelectTrigger id="difficulty-select-ui" className="w-36">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </UiSelect>
                </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Choose a Song</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 justify-items-center">
                  {songCards.length === 0 ? (
                    <div className="text-sm text-muted-foreground col-span-2">Loading songs…</div>
                  ) : (
                    songCards.map((s, i) => (
                                             <button
                         key={s.id}
                         type="button"
                         onClick={() => { setSelectedSong(s.id); const el=document.getElementById('song-select') as HTMLSelectElement|null; if(el){ el.value=s.id; el.dispatchEvent(new Event('change', { bubbles: true })); } }}
                         className={`group text-left transition ${selectedSong===s.id ? 'ring-2 ring-primary rounded-xl' : ''}`}
                       >
                         <div className="card holo-card w-[220px] mx-auto" data-rarity="rare holo galaxy" tabIndex={0}>
                           <div className="card__translater">
                             <div className="card__rotator">
                               <div className="card__front relative">
                                 <img src={`/cards/placeholder-card-featured.png`} alt={s.title} className="block w-full h-auto rounded-xl shadow-[rgba(0,0,0,0.25)_0px_18px_36px_-12px]" />
                                 <div className="card__shine" />
                                 <div className="card__glare" />
                                 <span className="card-title" style={{ position: 'absolute', top: '5.5%', right: '40%', left: '12%', zIndex: 10, fontSize: 'clamp(0.6rem, 10cqw, 1rem)' }}>{s.title.split(' - ')[0].slice(0, 12)}</span>
                                 <span className="card-title" style={{ position: 'absolute', top: '57.75%', right: '28%', left: '18%', zIndex: 10, fontSize: 'clamp(0.6rem, 1cqw, 1rem)', fontStyle: 'italic' }}>{s.title.slice(0, 12)}</span>
                                 <span style={{ position: 'absolute', top: '66%', right: '24.5%', left: '11.5%', zIndex: 10, fontSize: 'clamp(0.4rem, 6cqw, 0.8rem)', lineHeight: 1.1 as any }}>[ {s.notes.join(', ')}{s.notes.length>=14 ? ', …' : ''} ]</span>
                                 <img alt="cover" loading="lazy" width={1000} height={1000} decoding="async" style={{ position: 'absolute', top: '13.7%', left: '12%', height: '42.5%', width: '76%', objectFit: 'cover' }} src={`/cards/card_img/${(i % 6) + 1}.png`} />
                               </div>
                             </div>
                           </div>
                         </div>
                       </button>
                    ))
                  )}
                </div>
              </div>

              {/* Hidden select to preserve existing game logic events */}
              <select id="song-select" className="hidden" defaultValue={selectedSong} aria-hidden="true" tabIndex={-1}>
                <option value="random">Random Notes</option>
                <option value="happy-birthday">Happy Birthday to You</option>
                <option value="ode-to-joy">Ode to Joy - Beethoven</option>

                <option value="come-as-you-are">Come as You Are</option>
                <option value="baby-shark">Baby Shark</option>
                <option value="mary-lamb">Mary Had A Little Lamb</option>
                <option value="twinkle-twinkle">Twinkle Twinkle</option>
              </select>
              <select id="difficulty-select" className="hidden" defaultValue={selectedDifficulty} aria-hidden="true" tabIndex={-1}>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
              <div className="flex items-center gap-3">
                <Button id="start-game">Start</Button>
                <Button id="back-home" variant="secondary">Back</Button>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-play-toggle" className="text-sm">Auto-Play</Label>
                <input type="checkbox" id="auto-play-toggle" />
              </div>
            </div>
            {/* Link out to Composer page */}
            <div className="space-y-2">
              <h2 className="text-base font-medium">AI Composer</h2>
              <p className="text-sm text-muted-foreground">Compose a new song with AI on the next page, then return to play it.</p>
              <Link href="/game/compose"><Button>Open AI Composer</Button></Link>
            </div>
          </div>
        </div>
      </section>

    <section id="game" className="screen hidden">
      <div className="hud">
        <div className="tag">Song: <span id="current-song">Random Notes</span></div>
        <div className="tag">Score: <span id="score">0</span></div>
        <div className="tag">Accuracy: <span id="accuracy">100%</span></div>
        <div className="tag">Difficulty: <span id="difficulty">Normal</span></div>
      </div>
      <div className="controls">
        <button id="pause-btn" className="btn" style={{ background: '#fbbf24' }}>Pause</button>
        <button id="quit-btn" className="btn" style={{ background: '#ef4444' }}>Quit</button>
      </div>

      <div id="scene">
        <div className="cat">
          <div id="head"></div>
          <div id="mouth"></div>
          <div id="paw-left"></div>
          <div id="paw-right"></div>
        </div>
        <div className="instruments"><div id="keyboard"></div></div>
      </div>

      <div id="note-track">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="note-lane"><div className="hit-zone"></div></div>
        ))}
      </div>

      <div className="combo-display" id="combo-display">COMBO!</div>
    </section>

    <div id="game-over" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="panel" style={{ width: 520, textAlign: 'center' }}>
        <h1 className="text-2xl font-bold white">Game Over</h1>
        <p>Final Score: <strong id="final-score">0</strong></p>
        <p>Accuracy: <strong id="final-accuracy">100%</strong></p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button id="play-again" className="btn">Play Again</button>
          <button id="to-menu" className="btn" style={{ background: '#e5e7eb', color: '#111' }}>Main Menu</button>
          <button id="publish-run" className="btn" style={{ background: '#38bdf8' }}>Publish</button>
          <button id="share-run" className="btn" style={{ background: '#10b981' }}>Share</button>
        </div>
      </div>
    </div>

    </>
  );
} 