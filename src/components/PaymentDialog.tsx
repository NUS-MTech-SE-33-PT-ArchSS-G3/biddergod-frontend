import { useState } from 'react';
import { createPaymentIntent, confirmPayment, type PaymentIntent } from '../services/paymentService';

export interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  auctionTitle: string;
  amount: number;
  sellerId: string;
  onPaymentSuccess?: () => void;
}

/**
 * Payment Dialog Component
 * Handles Stripe payment for auction winners
 *
 * Note: This is a simplified implementation using test card details.
 * In production, you should use @stripe/react-stripe-js with Stripe Elements
 * for secure card input and PCI compliance.
 */
export function PaymentDialog({
  isOpen,
  onClose,
  auctionId,
  auctionTitle,
  amount,
  sellerId,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'init' | 'payment' | 'success'>('init');

  // Test card details (for development only)
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2025');
  const [cvc, setCvc] = useState('123');

  // Initialize payment intent
  const handleInitiatePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const intent = await createPaymentIntent(auctionId, amount, sellerId);
      setPaymentIntent(intent);
      setStep('payment');
    } catch (err) {
      console.error('Failed to create payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!paymentIntent) return;

    try {
      setIsProcessing(true);
      setError(null);

      // In production, you would use Stripe.js to create a payment method
      // For now, we'll use a test payment method ID
      // This requires @stripe/stripe-js package integration

      // Simplified flow: use test payment method
      const testPaymentMethodId = 'pm_card_visa'; // Stripe test payment method

      const confirmation = await confirmPayment(paymentIntent.id, testPaymentMethodId);

      if (confirmation.status === 'succeeded') {
        setStep('success');
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else if (confirmation.status === 'requires_payment_method') {
        setError('Payment failed. Please check your card details and try again.');
      } else {
        setError(`Payment status: ${confirmation.status}`);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('init');
    setPaymentIntent(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {step === 'success' ? 'Payment Successful!' : 'Complete Payment'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step 1: Initialize */}
          {step === 'init' && (
            <div className="space-y-6">
              {/* Item Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item
                </label>
                <p className="text-gray-900 font-medium">{auctionTitle}</p>
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-3xl font-bold text-indigo-600">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Initiate Button */}
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          )}

          {/* Step 2: Payment Form */}
          {step === 'payment' && (
            <div className="space-y-6">
              {/* Amount Summary */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-indigo-900 font-medium">Amount to Pay</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Test Card Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">ℹ️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Test Mode</p>
                    <p>Use test card: 4242 4242 4242 4242</p>
                    <p>Any future date and CVC</p>
                  </div>
                </div>
              </div>

              {/* Card Details Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={16}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <input
                      type="text"
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      placeholder="MM"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      placeholder="YYYY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing Payment...' : `Pay $${amount.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600">
                  Your payment of ${amount.toLocaleString()} has been processed successfully.
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Item</span>
                    <span className="font-medium text-gray-900">{auctionTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-medium text-gray-900">${amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-900">{paymentIntent?.id}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentDialog;