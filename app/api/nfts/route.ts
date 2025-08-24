import { NextRequest, NextResponse } from 'next/server';
import { Alchemy, Network } from 'alchemy-sdk';

type OwnedNftLike = {
  contract?: { address?: string; contractAddress?: string };
  tokenId?: string | number;
  title?: string;
  media?: Array<{ gateway?: string }>; // legacy shape
  rawMetadata?: { name?: string; image?: string };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner')?.toLowerCase();
  if (!owner) {
    return NextResponse.json({ success: false, error: 'Missing owner' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Alchemy key not configured' }, { status: 500 });
  }

  try {
    const alchemy = new Alchemy({ apiKey, network: Network.SHAPE_SEPOLIA });
    const resp = await alchemy.nft.getNftsForOwner(owner, { pageSize: 24 });

    const items = (resp.ownedNfts as unknown as OwnedNftLike[]).map((nft) => {
      const contract = nft.contract?.address || nft.contract?.contractAddress || '';
      const media = nft.media ?? [];
      const raw = nft.rawMetadata ?? {};
      const title = nft.title || raw.name || 'Untitled';
      const imageUrl = media?.[0]?.gateway || raw.image || null;
      return {
        contract,
        tokenId: String(nft.tokenId ?? ''),
        title,
        imageUrl,
      };
    });

    return NextResponse.json({ success: true, nfts: items }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 