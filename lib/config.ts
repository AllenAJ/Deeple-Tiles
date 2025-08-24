export const config = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
  alchemyKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY as string,
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  mcpServerUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL as string,
  musicNftAddress: process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS as string | undefined,
  performanceNftAddress: process.env.NEXT_PUBLIC_PERFORMANCE_NFT_ADDRESS as string | undefined,
  deepleNftAddress: process.env.NEXT_PUBLIC_DEEPLE_NFT_ADDRESS as string | undefined,
} as const;
