// Auction entity

export interface Auction {
  id: string;
  itemName: string;
  itemDescription: string;
  category: string;
  condition: string;
  imageUrls: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: string;
  winnerId?: string | null;
  startTime: string;
  endTime: string;
  status: 'draft' | 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// Frontend display format
export interface AuctionDisplay {
  id: string;
  title: string;
  itemDescription: string;
  startingPrice: number;
  currentBid: number;
  imageUrls: string[];
  condition?: string;
  auctionEndTime: string;
  status: string;
  totalBids: number;
  sellerName: string;
  winnerId?: string | null;
  category?: string;
}

// API response types
export interface GetAuctionsResponse {
  auctions: Auction[];
}

export interface GetAuctionResponse {
  auction: Auction;
}

export interface CreateAuctionRequest {
  itemName: string;
  itemDescription: string;
  startingPrice: number;
  sellerId: string;
  startTime: string; // ISO 8601 datetime
  endTime: string; // ISO 8601 datetime
}

export interface CreateAuctionResponse {
  auction: Auction;
}

// Utility function to convert backend Auction to frontend AuctionDisplay
export function mapAuctionToDisplay(auction: Auction): AuctionDisplay {
  return {
    id: auction.id,
    title: auction.itemName,
    itemDescription: auction.itemDescription,
    startingPrice: auction.startingPrice,
    currentBid: auction.currentPrice,
    imageUrls: auction.imageUrls ? auction.imageUrls.split(',') : [],
    condition: auction.condition, // Not in backend schema yet
    auctionEndTime: auction.endTime,
    status: auction.status,
    totalBids: 0, // TODO: Will need bid count from bidding service
    sellerName: auction.sellerId, // TODO: Fetch seller name from user service
    winnerId: auction.winnerId,
    category: auction.category, // Not in backend schema yet
  };
}