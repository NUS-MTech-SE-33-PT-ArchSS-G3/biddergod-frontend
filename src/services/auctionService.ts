// Auction Service API Client
import type {
  Auction,
  CreateAuctionRequest,
} from '../types/auction';

// Kong API Gateway URL - routes to auction service
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const API_BASE_PATH = '/api/auctions';

// Error handling helper
class AuctionServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'AuctionServiceError';
  }
}

/**
 * Get all auctions
 */
export async function getAllAuctions(): Promise<Auction[]> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuctionServiceError(
        `Failed to fetch auctions: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Backend returns array directly, not wrapped in { auctions: [...] }
    const data: Auction[] = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      throw error;
    }

    // Network or other errors
    throw new AuctionServiceError(
      `Network error while fetching auctions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Get auction by ID
 */
export async function getAuctionById(id: string): Promise<Auction> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuctionServiceError(
        `Failed to fetch auction ${id}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Backend returns auction object directly, not wrapped in { auction: {...} }
    const data: Auction = await response.json();
    return data;
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      throw error;
    }

    throw new AuctionServiceError(
      `Network error while fetching auction ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Create new auction
 */
export async function createAuction(data: CreateAuctionRequest): Promise<Auction> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuctionServiceError(
        `Failed to create auction: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Backend returns auction object directly, not wrapped in { auction: {...} }
    const auction: Auction = await response.json();
    return auction;
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      throw error;
    }

    throw new AuctionServiceError(
      `Network error while creating auction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Update an existing auction
 */
export async function updateAuction(id: string, data: Partial<CreateAuctionRequest>): Promise<Auction> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuctionServiceError(
        `Failed to update auction ${id}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Backend returns auction object directly, not wrapped in { auction: {...} }
    const auction: Auction = await response.json();
    return auction;
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      throw error;
    }

    throw new AuctionServiceError(
      `Network error while updating auction ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Open auction
 */
export async function openAuction(id: string): Promise<Auction> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}/${id}/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuctionServiceError(
        `Failed to open auction ${id}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Backend returns auction object directly
    const auction: Auction = await response.json();
    return auction;
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      throw error;
    }

    throw new AuctionServiceError(
      `Network error while opening auction ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * End auction
 */
export async function endAuction(id: string): Promise<Auction> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}/${id}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuctionServiceError(
        `Failed to end auction ${id}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Backend returns auction object directly
    const auction: Auction = await response.json();
    return auction;
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      throw error;
    }

    throw new AuctionServiceError(
      `Network error while ending auction ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

export const auctionService = {
  getAllAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  openAuction,
  endAuction,
};

export default auctionService;