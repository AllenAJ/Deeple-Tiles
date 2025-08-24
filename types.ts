export type McpTool = {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
};

export type McpStatusResponse = {
  success: boolean;
  message?: string;
  availableTools?: McpTool[];
  error?: string;
};

export type McpResponse = {
  success: boolean;
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  error?: string;
  toolName?: string;
};

// Frontend types that match backend output types
export type CollectionAnalyticsData = {
  contractAddress: string;
  timestamp: string;
  name: string | null;
  symbol: string | null;
  totalSupply: number | null;
  ownerCount: number | null;
  contractType: string | null;
  sampleNfts: Array<{
    tokenId: string;
    name: string | null;
    imageUrl: string | null;
  }>;
  floorPrice: {
    openSea: {
      floorPrice: number | null;
      priceCurrency: string | null;
      collectionUrl: string | null;
      retrievedAt: string | null;
    } | null;
    looksRare: {
      floorPrice: number | null;
      priceCurrency: string | null;
      collectionUrl: string | null;
      retrievedAt: string | null;
    } | null;
  } | null;
};

export type CreatorAnalyticsData = {
  address: string;
  ensName: string | null;
  timestamp: string;
  totalGasbackEarnedETH: number;
  currentBalanceETH: number;
  registeredContracts: number;
};

export type TopCreatorsData = {
  timestamp: string;
  totalCreatorsAnalyzed: number;
  topCreators: Omit<CreatorAnalyticsData, 'timestamp'>[];
};

export type ShapeNftData = {
  ownerAddress: string;
  timestamp: string;
  totalNfts: number;
  nfts: Array<{
    tokenId: string;
    contractAddress: string;
    name: string | null;
    imageUrl: string | null;
  }>;
};

export type StackAchievementsData = {
  userAddress: string;
  timestamp: string;
  hasStack: boolean;
  totalMedals: number;
  medalsByTier: {
    bronze: number;
    silver: number;
    gold: number;
    special: number;
  };
  lastMedalClaimed: {
    medalUID: string;
    claimedAt: string;
  } | null;
};

export type TransactionData = {
  to: string;
  data: string;
  value: string;
};

export type PrepareMintSVGNFTData = {
  success: boolean;
  transaction: TransactionData;
  metadata: {
    contractAddress: string;
    functionName: string;
    recipientAddress: string;
    tokenURI: string;
    nftMetadata: Record<string, unknown>;
    estimatedGas: string;
    chainId: number;
    explorerUrl: string;
  };
  instructions: {
    nextSteps: string[];
  };
};

// ================== Music and Rhythm Types ==================
export type MusicNote = {
  key: number; // 0-9 where 0 maps to lane 9
  time: number; // ms from start
};

export type MusicComposition = {
  title: string;
  bpm: number;
  keySignature?: string;
  scale?: string;
  notes: MusicNote[];
  seed?: string | number;
  prompt?: string;
};

export type GenerateSongRequest = {
  prompt?: string;
  seed?: string | number;
  fromNft?: { contract: string; tokenId: string };
  difficulty?: 'easy' | 'normal' | 'hard';
  bpm?: number;
};

export type GenerateSongResponse = {
  success: true;
  composition: MusicComposition;
};

export type ErrorResponse = {
  success: false;
  error: string;
};
