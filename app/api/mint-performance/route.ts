import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, tokenURI } = body || {};
    if (!to || !tokenURI) return NextResponse.json({ success: false, error: 'Missing to or tokenURI' }, { status: 400 });
    if (!config.performanceNftAddress) return NextResponse.json({ success: false, error: 'PERFORMANCE_NFT not configured' }, { status: 400 });

    // Minimal ERC-721 mint(address to, string tokenURI) selector 0x40c10f19 is for mint(address,uint256)
    // We'll assume a custom function mintTo(address,string) with selector precomputed server-side in real impl.
    // For now, return a safe fallback requiring frontend ABI if needed.

    return NextResponse.json({
      success: true,
      tx: {
        to: config.performanceNftAddress,
        data: '0x',
        value: '0x0',
      },
    }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 