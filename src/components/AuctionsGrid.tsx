import { useState, useEffect } from 'react';
import { AuctionCard } from './AuctionCard';
import SearchAndFilter from './SearchAndFilter';
import WinnerNotification from './WinnerNotification';
import PaymentDialog from './PaymentDialog';
import { getAllAuctions } from '../services/auctionService';
import { mapAuctionToDisplay } from '../types/auction';
import type { AuctionDisplay } from '../types/auction';
import { useSSE, type SSEEvent } from '../hooks/useSSE';
import { API_ENDPOINTS } from '../config/api';
import type { UserWithEmail } from '../App';

interface AuctionsGridProps {
  currentUsername?: string;
  user?: UserWithEmail | null;
}

// Winner notification state
interface WinnerNotificationData {
  auctionId: string;
  auctionTitle: string;
  finalPrice: number;
  paymentDeadline?: string;
  sellerId: string;
}

export default function AuctionsGrid({ currentUsername, user }: AuctionsGridProps = {}) {
  const [auctions, setAuctions] = useState<AuctionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('ending_soon');
  const [updatedAuctionIds, setUpdatedAuctionIds] = useState<Set<string>>(new Set());

  // Winner notification state
  const [winnerNotification, setWinnerNotification] = useState<WinnerNotificationData | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Handle SSE events for real-time price updates
  const handleSSEEvent = (event: SSEEvent) => {
    console.log('SSE Event received:', event);

    switch (event.type) {
      case 'connected':
        console.log('Connected to SSE stream as:', event.userId);
        break;

      case 'bid.placed':
      case 'bids.placed':
      case 'BidPlaced':
      case 'BidsPlaced':
      case 'price.updated':
      case 'PriceUpdated':
        // Public event - update auction price in real-time
        if (event.data?.auctionId) {
          setAuctions((prevAuctions) =>
            prevAuctions.map((auction) => {
              if (auction.id === event.data.auctionId) {
                // Add visual feedback for updated auction
                setUpdatedAuctionIds((prev) => new Set(prev).add(auction.id));

                // Remove highlight after 3 seconds
                setTimeout(() => {
                  setUpdatedAuctionIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(auction.id);
                    return newSet;
                  });
                }, 3000);

                return {
                  ...auction,
                  currentBid: event.data.newPrice || event.data.amount || auction.currentBid,
                  totalBids: event.data.bidCount !== undefined ? event.data.bidCount : auction.totalBids + 1,
                };
              }
              return auction;
            })
          );
        }
        break;

      case 'auction.opened':
      case 'AuctionOpened':
        // Refresh auctions when a new auction is opened
        console.log('New auction opened, refreshing list...');
        handleRefresh();
        break;

      case 'auction.closed':
      case 'AuctionClosed':
        // Update auction status to closed
        if (event.data?.auctionId) {
          setAuctions((prevAuctions) =>
            prevAuctions.map((auction) =>
              auction.id === event.data.auctionId
                ? { ...auction, status: 'closed' }
                : auction
            )
          );
        }
        break;

      case 'payment.required':
      case 'PaymentRequired':
        // TARGETED EVENT - Only winner and seller receive this
        // Show winner notification if current user won the auction
        if (event.data?.winnerId && event.data.winnerId === currentUsername) {
          // Find auction details from local state
          const auction = auctions.find((a) => a.id === event.data.auctionId);

          setWinnerNotification({
            auctionId: event.data.auctionId,
            auctionTitle: auction?.title || 'Auction Item',
            finalPrice: event.data.amount || auction?.currentBid || 0,
            paymentDeadline: event.data.paymentDeadline,
            sellerId: event.data.sellerId,
          });

          console.log('You won the auction! Payment required.');
        }
        break;

      case 'auction.won':
      case 'AuctionWon':
        // TARGETED EVENT - Only winner receives this
        console.log('Congratulations! You won auction:', event.data?.auctionId);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  };

  // Connect to SSE stream only if user is authenticated
  const { isConnected: sseConnected } = useSSE({
    url: API_ENDPOINTS.SSE.EVENTS,
    onEvent: handleSSEEvent,
    onOpen: () => {
      console.log('SSE connection opened for real-time auction updates');
    },
    onError: (error) => {
      console.error('SSE connection error:', error);
    },
    autoConnect: !!user, // Only auto-connect if user is authenticated
    autoReconnect: !!user,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
    debug: true,
  });

  // Fetch auctions from API on component mount
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const auctionData = await getAllAuctions();
        // console.table(auctionData);
        const displayAuctions = auctionData.map(mapAuctionToDisplay);
        setAuctions(displayAuctions);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  // Refresh function for manual reload
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const auctionData = await getAllAuctions();
      const displayAuctions = auctionData.map(mapAuctionToDisplay);
      setAuctions(displayAuctions);
    } catch (err) {
      console.error('Error refreshing auctions:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh auctions');
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = auctions
    .filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.itemDescription.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || auction.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'ending_soon':
          return new Date(a.auctionEndTime).getTime() - new Date(b.auctionEndTime).getTime();
        case 'newest':
          return new Date(b.auctionEndTime).getTime() - new Date(a.auctionEndTime).getTime();
        case 'price_low':
          return (a.currentBid || a.startingPrice) - (b.currentBid || b.startingPrice);
        case 'price_high':
          return (b.currentBid || b.startingPrice) - (a.currentBid || a.startingPrice);
        case 'most_bids':
          return b.totalBids - a.totalBids;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* SSE Connection Status */}
      {user && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
            <span className="text-sm text-gray-600">
              {sseConnected ? 'Bidding Live' : 'Connecting to live updates...'}
            </span>
          </div>
          {sseConnected && (
            <span className="text-xs text-gray-500">
              Real-time price updates enabled
            </span>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <SearchAndFilter
        onSearch={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        resultsCount={filteredAuctions.length}
      />

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading auctions...
          </h3>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-lg border border-red-200 p-12 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Failed to load auctions
          </h3>
          <p className="text-red-600 mb-6">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Auctions Grid */}
      {!loading && !error && filteredAuctions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              {...auction}
              currentUsername={currentUsername}
              onAuctionUpdate={handleRefresh}
              isUpdated={updatedAuctionIds.has(auction.id)}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filteredAuctions.length === 0 && auctions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No auctions found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search criteria or browse all categories
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSortBy('ending_soon');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* No Auctions at All */}
      {!loading && !error && auctions.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No auctions available
          </h3>
          <p className="text-gray-500">
            There are currently no auctions to display. Check back later!
          </p>
        </div>
      )}

      {/* Winner Notification */}
      {winnerNotification && (
        <WinnerNotification
          auctionId={winnerNotification.auctionId}
          auctionTitle={winnerNotification.auctionTitle}
          finalPrice={winnerNotification.finalPrice}
          paymentDeadline={winnerNotification.paymentDeadline}
          onPayNow={() => {
            setIsPaymentDialogOpen(true);
          }}
          onDismiss={() => {
            setWinnerNotification(null);
          }}
        />
      )}

      {/* Payment Dialog */}
      {winnerNotification && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
          }}
          auctionId={winnerNotification.auctionId}
          auctionTitle={winnerNotification.auctionTitle}
          amount={winnerNotification.finalPrice}
          sellerId={winnerNotification.sellerId}
          onPaymentSuccess={() => {
            setWinnerNotification(null);
            setIsPaymentDialogOpen(false);
            // Optionally refresh auctions to show updated status
            void handleRefresh();
          }}
        />
      )}
    </div>
  );
}