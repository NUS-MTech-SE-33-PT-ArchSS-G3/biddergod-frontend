// Bidding Service API Client
// Handles communication with the bid-command service (CQRS Write side)

import { v4 as uuidv4 } from 'uuid';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_ENDPOINTS } from '../config/api';

// Request/Response types
export interface PlaceBidRequest {
  bidderId: string;
  amount: number;
}

export interface PlaceBidResponse {
  bidId: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: string;
  message?: string;
}

// Error handling
class BiddingServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'BiddingServiceError';
  }
}

/**
 * Place a bid on an auction
 * Uses Idempotency-Key header to prevent duplicate bids
 */
export async function placeBid(
  auctionId: string,
  bidderId: string,
  amount: number
): Promise<PlaceBidResponse> {
  try {
    // Generate unique idempotency key for this bid
    const idempotencyKey = uuidv4();

    // Get JWT access token from AWS Amplify session
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new BiddingServiceError('No access token available. Please sign in again.');
    }

    const response = await fetch(API_ENDPOINTS.BID_COMMAND.PLACE_BID(auctionId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        bidderId,
        amount,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to place bid: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If error response is not JSON, use status text
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new BiddingServiceError(
        errorMessage,
        response.status
      );
    }

    const data: PlaceBidResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof BiddingServiceError) {
      throw error;
    }

    // Network or other errors
    throw new BiddingServiceError(
      `Network error while placing bid: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Get bid history for an auction (from bid-query service)
 */
export interface BidHistoryParams {
  cursor?: string;
  limit?: number;
  direction?: 'asc' | 'desc';
}

export interface BidHistoryResponse {
  bids: Array<{
    bidId: string;
    auctionId: string;
    bidderId: string;
    amount: number;
    timestamp: string;
  }>;
  nextCursor?: string;
  hasMore: boolean;
}

export async function getBidHistory(
  auctionId: string,
  params?: BidHistoryParams
): Promise<BidHistoryResponse> {
  try {
    const endpoint = API_ENDPOINTS.BID_QUERY.BY_AUCTION(auctionId, params);

    // Get JWT access token from AWS Amplify session
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new BiddingServiceError('No access token available. Please sign in again.');
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BiddingServiceError(
        `Failed to fetch bid history: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const data: BidHistoryResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof BiddingServiceError) {
      throw error;
    }

    throw new BiddingServiceError(
      `Network error while fetching bid history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

export const biddingService = {
  placeBid,
  getBidHistory,
};

export default biddingService;