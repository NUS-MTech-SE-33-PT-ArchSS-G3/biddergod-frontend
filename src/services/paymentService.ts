// Payment Service API Client
// Handles communication with the payment service (NestJS + Stripe)

import { fetchAuthSession } from 'aws-amplify/auth';
import { API_ENDPOINTS } from '../config/api';

// Request/Response types
export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  customerId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface ConfirmPaymentRequest {
  paymentMethodId: string;
}

export interface PaymentConfirmation {
  id: string;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'failed';
  amount: number;
  currency: string;
}

// Error handling
class PaymentServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

/**
 * Create a payment intent for auction payment
 */
export async function createPaymentIntent(
  auctionId: string,
  amount: number,
  sellerId: string
): Promise<PaymentIntent> {
  try {
    // Get JWT access token from AWS Amplify session
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new PaymentServiceError('No access token available. Please sign in again.');
    }

    const response = await fetch(API_ENDPOINTS.PAYMENT.CREATE_INTENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: 'usd',
        metadata: {
          auctionId,
          sellerId,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create payment intent: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new PaymentServiceError(errorMessage, response.status);
    }

    const data: PaymentIntent = await response.json();
    return data;
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(
      `Network error while creating payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new PaymentServiceError('No access token available. Please sign in again.');
    }

    const response = await fetch(API_ENDPOINTS.PAYMENT.GET_INTENT(paymentIntentId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new PaymentServiceError(
        `Failed to fetch payment intent: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const data: PaymentIntent = await response.json();
    return data;
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(
      `Network error while fetching payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Confirm payment with payment method
 */
export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentConfirmation> {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new PaymentServiceError('No access token available. Please sign in again.');
    }

    const response = await fetch(API_ENDPOINTS.PAYMENT.CONFIRM(paymentIntentId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to confirm payment: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new PaymentServiceError(errorMessage, response.status);
    }

    const data: PaymentConfirmation = await response.json();
    return data;
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(
      `Network error while confirming payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

export const paymentService = {
  createPaymentIntent,
  getPaymentIntent,
  confirmPayment,
};

export default paymentService;