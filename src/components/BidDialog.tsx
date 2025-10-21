import { useState, useEffect } from 'react';
import { placeBid } from '../services/biddingService';

export interface BidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  auctionTitle: string;
  currentBid: number;
  startingPrice: number;
  bidderId: string;
  onBidPlaced?: () => void;
}

export default function BidDialog({
  isOpen,
  onClose,
  auctionId,
  auctionTitle,
  currentBid,
  startingPrice,
  bidderId,
  onBidPlaced,
}: BidDialogProps) {
  // Round to avoid floating point precision issues (e.g., 21009.00 + 1 = 21010.00, not 21010.001)
  const minimumBid = currentBid > 0 ? Math.ceil(currentBid + 1) : Math.ceil(startingPrice);
  const [bidAmount, setBidAmount] = useState<number>(minimumBid);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset bid amount when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBidAmount(minimumBid);
      setError(null);
    }
  }, [isOpen, minimumBid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (bidAmount < minimumBid) {
      setError(`Bid must be at least $${minimumBid}`);
      return;
    }

    if (!bidderId) {
      setError('You must be signed in to place a bid');
      return;
    }

    try {
      setIsSubmitting(true);

      // Call bidding service API
      const response = await placeBid(auctionId, bidderId, bidAmount);

      console.log('Bid placed successfully:', response);

      // Show success message
      alert(`Bid placed successfully! Your bid: $${bidAmount}`);

      // Call parent callback to refresh auction data
      if (onBidPlaced) {
        onBidPlaced();
      }

      // Close dialog
      onClose();
    } catch (err) {
      console.error('Failed to place bid:', err);
      setError(err instanceof Error ? err.message : 'Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncrementBid = (increment: number) => {
    setBidAmount((prev) => prev + increment);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Place Your Bid</h2>
          <p className="text-sm text-gray-600 line-clamp-2">{auctionTitle}</p>
        </div>

        {/* Current Bid Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Current Bid:</span>
            <span className="text-lg font-semibold text-gray-900">
              ${currentBid > 0 ? currentBid.toLocaleString() : startingPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Minimum Bid:</span>
            <span className="text-lg font-semibold text-indigo-600">
              ${minimumBid.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bid Form */}
        <form onSubmit={handleSubmit}>
          {/* Bid Amount Input */}
          <div className="mb-6">
            <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Your Bid Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                $
              </span>
              <input
                type="number"
                id="bidAmount"
                value={bidAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // If empty string, set to minimumBid, otherwise parse as number
                  if (value === '' || value === null) {
                    setBidAmount(minimumBid);
                  } else {
                    const numValue = parseFloat(value);
                    setBidAmount(isNaN(numValue) ? minimumBid : numValue);
                  }
                }}
                min={minimumBid}
                step="1"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                required
              />
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Quick increment:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleIncrementBid(1)}
                className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                +$1
              </button>
              <button
                type="button"
                onClick={() => handleIncrementBid(5)}
                className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                +$5
              </button>
              <button
                type="button"
                onClick={() => handleIncrementBid(10)}
                className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                +$10
              </button>
              <button
                type="button"
                onClick={() => handleIncrementBid(50)}
                className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                +$50
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> By placing a bid, you agree to purchase this item if you win the auction.
          </p>
        </div>
      </div>
    </div>
  );
}