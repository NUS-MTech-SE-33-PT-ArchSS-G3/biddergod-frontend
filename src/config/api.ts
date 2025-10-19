/**
 * API Configuration
 * Centralized API endpoint configuration for all microservices
 * All requests go through Kong API Gateway at localhost:8000
 */

// Kong API Gateway base URL
export const KONG_GATEWAY_URL = 'http://localhost:8000';

/**
 * API Endpoints Configuration
 * Based on Kong configuration at docker-compose/config/kong.yaml
 */
export const API_ENDPOINTS = {
  // User Service (Spring Boot)
  // Routes: /api/users -> user-service:8080
  USER: {
    BASE: `${KONG_GATEWAY_URL}/api/users`,
    HEALTH: `${KONG_GATEWAY_URL}/api/users/health`, // If exists
  },

  // Auction Service (Node.js/Express)
  // Routes: /api/auctions -> auction-service:4000/auctions/* (strip_path: true removes /api/auctions, forwards rest to /auctions/*)
  //         /api/auction-health -> auction-service:4000/health (strip_path: true)
  // Note: strip_path=true with service url http://auction-service:4000/auctions means:
  //   Request: GET /api/auctions/123 -> Forwards to: GET http://auction-service:4000/auctions/123
  AUCTION: {
    BASE: `${KONG_GATEWAY_URL}/api/auctions`,
    HEALTH: `${KONG_GATEWAY_URL}/api/auction-health`,
    BY_ID: (id: string) => `${KONG_GATEWAY_URL}/api/auctions/${id}`,
    OPEN: (id: string) => `${KONG_GATEWAY_URL}/api/auctions/${id}/open`,
    END: (id: string) => `${KONG_GATEWAY_URL}/api/auctions/${id}/end`,
  },

  // Bid Command Service (Go - CQRS Write)
  // Routes: POST /api/v1/bids/{auctionId} -> bid-command:8080/api/v1/bids/{auctionId}
  BID_COMMAND: {
    BASE: `${KONG_GATEWAY_URL}/api/v1/bids`,
    PLACE_BID: (auctionId: string) => `${KONG_GATEWAY_URL}/api/v1/bids/${auctionId}`,
  },

  // Bid Query Service (Go - CQRS Read)
  // Routes: GET /api/v1/bids/{auctionId} -> bid-query:8080/api/v1/bids/{auctionId}
  BID_QUERY: {
    BASE: `${KONG_GATEWAY_URL}/api/v1/bids`,
    BY_AUCTION: (auctionId: string, params?: { cursor?: string; limit?: number; direction?: 'asc' | 'desc' }) => {
      const queryParams = new URLSearchParams();
      if (params?.cursor) queryParams.append('cursor', params.cursor);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.direction) queryParams.append('direction', params.direction);
      const queryString = queryParams.toString();
      return `${KONG_GATEWAY_URL}/api/v1/bids/${auctionId}${queryString ? '?' + queryString : ''}`;
    },
  },

  // Payment Service (NestJS)
  // Routes: /api/payments -> payment-service:3000/api/payments
  PAYMENT: {
    BASE: `${KONG_GATEWAY_URL}/api/payments`,
  },

  // SSE Stream Service (Node.js/Express)
  // Routes: /events -> sse-stream-service:5535/events
  SSE: {
    EVENTS: `${KONG_GATEWAY_URL}/events`,
  },
} as const;

/**
 * Direct Service Endpoints (Bypass Kong)
 * Use these for health checks or debugging purposes only
 * Note: These will only work if services are exposed on host machine
 */
export const DIRECT_SERVICE_ENDPOINTS = {
  USER_SERVICE: 'http://localhost:8081',
  AUCTION_SERVICE: 'http://localhost:4000',
  BID_COMMAND: 'http://localhost:8082',
  BID_QUERY: 'http://localhost:8083',
  PAYMENT_SERVICE: 'http://localhost:3000',
  SSE_STREAM: 'http://localhost:5535',
} as const;

/**
 * Rate Limits (from Kong configuration)
 */
export const RATE_LIMITS = {
  USER_SERVICE: 100, // requests per minute
  AUCTION_SERVICE: 100, // requests per minute
  BID_COMMAND: 200, // requests per minute
  BID_QUERY: 300, // requests per minute
  PAYMENT_SERVICE: 50, // requests per minute
  SSE_STREAM: Infinity, // No rate limiting for long-lived connections
} as const;

/**
 * Service Timeouts (from Kong configuration)
 */
export const SERVICE_TIMEOUTS = {
  DEFAULT: {
    CONNECT: 60000, // 60 seconds
    WRITE: 60000, // 60 seconds
    READ: 60000, // 60 seconds
  },
  SSE: {
    CONNECT: 60000, // 60 seconds
    WRITE: 3600000, // 1 hour (for long-lived SSE connections)
    READ: 3600000, // 1 hour
  },
} as const;