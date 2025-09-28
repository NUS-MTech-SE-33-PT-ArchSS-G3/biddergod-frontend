import { useState } from 'react';
import { AuctionCard } from './AuctionCard';
import SearchAndFilter from './SearchAndFilter';

const mockAuctions = [
  {
    id: '1',
    title: 'Vintage Rolex Submariner Watch',
    description: 'Authentic 1980s Rolex Submariner in excellent condition. Recently serviced with certificate of authenticity.',
    startingPrice: 3000,
    currentBid: 4200,
    imageUrls: ['https://images.unsplash.com/photo-1671119720870-df45dcaf81c1?q=80&w=1055&auto=format&fit=crop'],
    condition: 'excellent',
    auctionEndTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalBids: 8,
    sellerName: 'WatchMaster',
    category: 'Fashion'
  },
  {
    id: '2',
    title: 'Antique Ship Model',
    description: 'Excellent replica of historic warship. Handcrafted with incredible attention to detail.',
    startingPrice: 699,
    currentBid: 750,
    imageUrls: ['https://images.unsplash.com/photo-1733240464733-9ed0d63147e1?q=80&w=2070&auto=format&fit=crop'],
    condition: 'like_new',
    auctionEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalBids: 2,
    sellerName: 'ShipMaster69',
    category: 'Antiquities'
  },
  {
    id: '3',
    title: 'Antique Gramophone',
    description: 'Beautiful antique gramophone from the 1900s, gold plated with rose wood finish.',
    startingPrice: 1200,
    currentBid: 1800,
    imageUrls: ['https://images.unsplash.com/photo-1518893883800-45cd0954574b?q=80&w=1034&auto=format&fit=crop'],
    condition: 'like_new',
    auctionEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalBids: 15,
    sellerName: 'BachAndBeyond',
    category: 'Antiquities'
  },
  {
    id: '4',
    title: 'Japanese Painting - 19th Century',
    description: 'Authentic Japanese artwork from the 19th century in remarkable condition.',
    startingPrice: 17000,
    currentBid: 19500,
    imageUrls: ['https://images.unsplash.com/photo-1585157603822-6ea06da9a49a?q=80&w=992&auto=format&fit=crop'],
    condition: 'like_new',
    auctionEndTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalBids: 6,
    sellerName: 'MountKanoKazusa',
    category: 'Art'
  },
  {
    id: '5',
    title: 'Antique Chess Set - Wooden Handcrafted',
    description: 'Beautiful handcrafted wooden chess set from the 1950s. All pieces intact with original board.',
    startingPrice: 150,
    currentBid: 220,
    imageUrls: ['https://images.unsplash.com/photo-1699813555526-9fd23f91c7b3?q=80&w=2070&auto=format&fit=crop'],
    condition: 'good',
    auctionEndTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalBids: 4,
    sellerName: 'AntiqueHunter',
    category: 'Collectibles'
  },
  {
    id: '6',
    title: 'Modern Art Sculpture',
    description: 'Contemporary bronze sculpture by emerging artist. Limited edition piece.',
    startingPrice: 800,
    currentBid: 0,
    imageUrls: [],
    condition: 'excellent',
    auctionEndTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalBids: 0,
    sellerName: 'ArtGallery',
    category: 'Art'
  }
];

export default function AuctionsGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('ending_soon');

  const filteredAuctions = mockAuctions
    .filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.description.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* Auctions Grid */}
      {filteredAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} {...auction} />
          ))}
        </div>
      ) : (
        /* No Results */
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
    </div>
  );
}