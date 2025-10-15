import { useState, useEffect } from 'react';
import { AuctionCard } from './AuctionCard';
import SearchAndFilter from './SearchAndFilter';
import { getAllAuctions } from '../services/auctionService';
import { mapAuctionToDisplay } from '../types/auction';
import type { AuctionDisplay } from '../types/auction';

interface AuctionsGridProps {
  currentUsername?: string;
}

export default function AuctionsGrid({ currentUsername }: AuctionsGridProps = {}) {
  const [auctions, setAuctions] = useState<AuctionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('ending_soon');

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
    </div>
  );
}