![Showcase](public/cards/showcase.png)

[▶ Watch the 5‑min demo (Tella)](https://www.tella.tv/video/cmepntscg000s0cjrfhpw996v?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=1)

[▶ Interact with the demo (Vercel)](https://deeple-tiles.vercel.app/game)

# Deeple Tiles – Rhythm + Onchain + AI (Shape MCP Demo)

Built for the AI × NFT on Shape hackathon: an autonomous AI musician agent that composes melodies, mints them as on‑chain music cards, and challenges players to perform them & the creators get gasback if others play their notes. The prototype demonstrates innovation in AI‑driven NFT creation, on‑chain provenance, and community curation.

Next.js 15 app with Shape Sepolia, Wagmi/RainbowKit, Viem, and the Shape MCP toolchain. Includes an ERC‑721 (`contracts/DeepleTiles.sol`) with compact on‑chain meta (`mintWithMeta` + `notesHash`) and demo leaderboard events.

## Highlights

Built for the AI × NFT on Shape hackathon. Novel AI composition + onchain provenance; working prototype with Shape primitives; clear UX for evaluation.

- Play preset songs (Happy Birthday, Ode to Joy, etc.) or auto‑generated melodies
- AI Composer page to generate a song from prompt or from your NFT image (optional OpenAI)
- Holo‑effect Deeple card preview and gallery
- Mint a Deeple NFT (ERC‑721 `mint(address,string)` with JSON tokenURI)
- Publish runs and view them on `/public` as cards with notes
- Pay‑to‑play on `/public` (0.00001 ETH tip to creator before playing their notes)
- Leaderboard (file‑backed for demo) and optional on‑chain `publishRun` in the contract
- Poink embed link is copied on Publish for easy sharing

## How it works (AI × NFT on Shape)

- AI agent composes and mints “music cards” (`mintWithMeta` + `notesHash`), then hosts rhythm challenges; playable, tip‑able assets push AI x NFT boundaries.
- AI Agent: Generates from mood/genre or wallet context (filters to Deeple Tiles); plans compose → review → mint → challenge → publish; adapts via manual difficulty and song selection.
- Libraries: Next.js 15 + Wagmi/RainbowKit/Viem on Shape Sepolia (`eth_sendTransaction`, `encodeFunctionData`); Foundry + OpenZeppelin ERC‑721; `publishRun` events; server components + file‑backed stores.
- Impact: Shareable onchain challenges with provenance, creator tips, and a `/public` gallery; easy to extend with Shape primitives.
- Design: Compact shadcn UI, holo cards, featured grid, chat‑like AI steps, clear CTAs.

## AI Agent — Keyboard‑to‑sound pipeline

- The agent compiles a time‑quantized performance plan (ms‑accurate), aligning each symbolic note to lane indices 0–9. Each lane maps to a discrete timbre in `@/sound` (`keyboard0.mp3` … `keyboard9.mp3`).
- On load it warm‑primes the Web Audio graph: one master `AudioContext`, all lane buffers pre‑decoded to `AudioBuffer`s, lane `GainNode`s and optional `StereoPannerNode`s, plus a gentle master compressor.
- Dual clocks for precision: visuals via `requestAnimationFrame`; audio scheduling locked to `AudioContext.currentTime`. Keystrokes (`Digit0`–`Digit9`) are phase‑aligned with a rolling median input‑latency offset and a micro look‑ahead for sub‑frame accuracy.
- Adaptive expressivity: per‑hit dynamic gain curves (brighter transients for on‑time hits), alternating lane panning for separation, anti‑mud heuristics (1–3 ms micro‑stagger in dense clusters) and momentary bus ducking to preserve headroom.
- Predictive prefetch: knowing future notes, it pre‑allocates/recycles source nodes to minimize GC pressure and throttles visuals before audio to keep playback click‑free under load.
- Error‑tolerant reconciliation: near‑miss hits snap audibly to the nearest quantized grid within a tight threshold; overlapping same‑lane hits spawn parallel sources with per‑instance gain to avoid inter‑sample clipping.
- File semantics: lane i → `keyboardi.mp3` in `@/sound` ensures deterministic timbre identity and cache locality.
- Provenance: the executed note lattice (lane indices + timing deltas) is hashed as `notesHash` for on‑chain binding between what was heard and what was performed.

## App structure

```
app/
  game/               # landing (/game), select, gameplay, over modal
  preview/            # single-card preview + play button (no header/footer)
  public/             # published runs shown as holo cards
  api/
    publications/     # GET/POST publication store (file-backed)
    leaderboard/      # demo leaderboard API (file-backed)
contracts/
  DeepleTiles.sol     # ERC-721 + compact card meta + demo leaderboard events
script/
  DeepleTiles.s.sol   # Foundry deployment script
lib/                  # web3 + config + music gen utilities
```

## Gameplay loop

1) Landing (`/game`)
- Holo card preview on the right, featured cards on the left (titles = first 10 chars; bottom line shows notes).
- Buttons: Start Playing → Select screen; Choose Song → Select screen; Get your first Deeple → mint a demo NFT on Shape Sepolia.

2) Select screen
- Choose preset song and difficulty.
- AI Composer link to `/game/compose` for generating a new melody.

3) During game
- Hit number keys 1–0 as notes fall. Score + accuracy shown on HUD.
- For preset songs, Game Over triggers once the last note is spawned and the track clears.

4) Game Over modal
- Play Again / Main Menu
- Publish → saves the notes and pushes to `/api/publications`, copies Poink embed to clipboard, then navigates to `/public`.
- Share → copies `/public` link.
- After a successful onchain transaction (Shape Sepolia), the run is also posted to the leaderboard.

## AI Composer (`/game/compose`)

- Generate from prompt or filter wallet NFTs to only show Deeple Tiles tokens.
- The composer card preview always uses the Deeple Deeple cover image.
- Actions: Mint this card, Play this card (saves to localStorage and routes to `/game`), Discard.

## Preview (`/preview`)

- Minimal page: one holo card + Play button. No header/footer.
- Designed for embeds; Publish copies: `https://app.poink.xyz/embed?url=https://<your-domain>/preview`.

## Public gallery (`/public`)

- Shows published entries as holo cards (3 per row).
- Each card renders:
  - Title = compressed contract address (e.g., `0xC5.....18F`) if configured, else fallback
  - Notes list `[...]`
  - “Pay 0.00001 and play” button, this will be a gasback contract to the creator
- The button sends 0.00001 ETH to the creator (or fallback), saves the notes as a generated composition, and routes to `/game` (auto‑starts).

## Onchain contract – `contracts/DeepleTiles.sol`

- ERC‑721 with:
  - `mint(address to, string uri)` – basic mint
  - `mintWithMeta(address to, string title, string mediaURI, bytes32 notesHash)` – compact on‑chain meta
  - `publishRun(uint256 score, uint256 accuracy, bytes32 songHash)` – demo on‑chain leaderboard event
  - `tipCreator(uint256 tokenId)` – forward ETH tips to card creator
- View helpers: `getCard`, `getLeaderboard`, `getLeaderboardLength`


## Environment variables

Set these in `.env` (and on Vercel → Project → Settings → Environment Variables):

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_ALCHEMY_KEY=...
NEXT_PUBLIC_CHAIN_ID=11011                   # Shape Sepolia
NEXT_PUBLIC_MCP_SERVER_URL=https://shape-mcp-server.vercel.app/mcp
NEXT_PUBLIC_DEEPLE_NFT_ADDRESS=0x743B0aa4f557C6c16C38f7D91Fa1a8968813B4Fc         # deployed DeepleTiles
OPENAI_API_KEY=...                          
```

## Local development

```bash
# install deps
npm install
# dev
npm run dev
```

Open http://localhost:3000/game

- Root Directory: `MCP backend`
- Build: `next build`
- Output: `.next`
- Node.js: 20.x
- `next.config.ts`: `eslint.ignoreDuringBuilds = true` to bypass vendored lint errors
- Persistence: publications/leaderboard are file‑backed (ephemeral on serverless). For persistence replace the store with Vercel KV/Supabase/Postgres.

## Keyboard

- Keys `1..0` – hit lanes
- Ctrl+A – toggle Auto‑Play (dev/testing)


## Thanks <3, I'd love to take this to production
