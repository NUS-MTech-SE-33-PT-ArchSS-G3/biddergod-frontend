import { useState } from 'react';

export interface WinnerNotificationProps {
  auctionId: string;
  auctionTitle: string;
  finalPrice: number;
  paymentDeadline?: string;
  onPayNow: () => void;
  onDismiss: () => void;
}

/**
 * Winner Notification Component
 * Displays when user wins an auction and needs to make payment
 */
export function WinnerNotification({
  auctionTitle,
  finalPrice,
  paymentDeadline,
  onPayNow,
  onDismiss,
}: WinnerNotificationProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getTimeUntilDeadline = () => {
    if (!paymentDeadline) return '';

    const deadline = new Date(paymentDeadline);
    const now = new Date();
    const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursRemaining <= 0) {
      return 'Payment overdue';
    } else if (hoursRemaining < 24) {
      return `${hoursRemaining} hours remaining`;
    } else {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    }
  };

  const timeRemaining = getTimeUntilDeadline();
  const isUrgent = paymentDeadline && new Date(paymentDeadline).getTime() - new Date().getTime() < 3 * 60 * 60 * 1000; // Less than 3 hours

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full bg-white rounded-xl shadow-2xl border-2 overflow-hidden transition-all duration-300 ${
        isDismissing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      } ${isUrgent ? 'border-red-500' : 'border-green-500'}`}
    >
      {/* Header */}
      <div className={`px-6 py-4 ${isUrgent ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {isUrgent ? 'URGENT!' : 'Pending'}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                {isUrgent ? 'Payment Deadline Approaching!' : 'Congratulations!'}
              </h3>
              <p className="text-white text-sm opacity-90">
                {isUrgent ? 'Complete payment soon' : 'You won the auction'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-4">
        {/* Auction Title */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Item</p>
          <p className="font-semibold text-gray-900 line-clamp-2">
            {auctionTitle}
          </p>
        </div>

        {/* Final Price */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Final Price</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-indigo-600">
                ${finalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Deadline */}
        {paymentDeadline && (
          <div className={`rounded-lg p-3 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center space-x-2">
              <span className="text-xl"></span>
              <div>
                <p className="text-xs text-gray-600">Payment Deadline</p>
                <p className={`font-medium ${isUrgent ? 'text-red-700' : 'text-blue-700'}`}>
                  {timeRemaining}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onPayNow}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              isUrgent
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Pay Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Later
          </button>
        </div>

        {/* Warning Text */}
        {isUrgent && (
          <div className="flex items-start space-x-2 pt-2">
            <span className="text-yellow-500 text-sm">⚠️</span>
            <p className="text-xs text-gray-600">
              Failure to complete payment by the deadline may result in penalties or loss of item.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WinnerNotification;