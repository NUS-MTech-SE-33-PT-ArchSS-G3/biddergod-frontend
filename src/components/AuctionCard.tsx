interface AuctionCardProps {
  id?: string;
  title?: string;
  description?: string;
  startingPrice?: number;
  currentBid?: number;
  imageUrls?: string[];
  condition?: string;
  auctionEndTime?: string;
  status?: string;
  totalBids?: number;
  sellerName?: string;
  category?: string;
}

export function AuctionCard({
  title = "Premium Auction Item",
  description = "A carefully curated item perfect for collectors and enthusiasts.",
  startingPrice = 100,
  currentBid = 0,
  imageUrls,
  condition = "excellent",
  auctionEndTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  status = "active",
  totalBids = 0,
  sellerName = "TrustedSeller",
  category = "Collectibles"
}: AuctionCardProps) {
  const timeLeft = getTimeRemaining(auctionEndTime);
  const displayPrice = currentBid > 0 ? currentBid : startingPrice;
  const hasImage = imageUrls && imageUrls.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100">
        {hasImage ? (
          <img
            src={imageUrls[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-gray-400 text-4xl">📦</div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-black/70 text-white rounded-full text-xs">
            {category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {description}
          </p>
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">
              ${displayPrice.toLocaleString()}
            </span>
            {currentBid > startingPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${startingPrice.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {currentBid > 0 ? 'Current bid' : 'Starting price'}
          </p>
        </div>

        {/* Auction Details */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <span>⏰ {timeLeft}</span>
            <span>🔨 {totalBids} bid{totalBids !== 1 ? 's' : ''}</span>
          </div>
          <span className="capitalize">{condition}</span>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {sellerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600">{sellerName}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            status !== 'active' || timeLeft === 'Ended'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          disabled={status !== 'active' || timeLeft === 'Ended'}
        >
          {timeLeft === 'Ended' ? 'Auction Ended' : 'Place Bid'}
        </button>
      </div>
    </div>
  );
}

function getTimeRemaining(endTime: string): string {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const distance = end - now;

  if (distance < 0) {
    return 'Ended';
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}