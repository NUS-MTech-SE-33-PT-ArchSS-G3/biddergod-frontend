import { useState } from 'react';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sortBy: string) => void;
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  resultsCount: number;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Collectibles', label: 'Collectibles' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Home', label: 'Home & Garden' },
  { value: 'Art', label: 'Art' },
  { value: 'Antiquities', label: 'Antiquities' },
];

const sortOptions = [
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'most_bids', label: 'Most Bids' },
];

export default function SearchAndFilter({
  onSearch,
  onCategoryChange,
  onSortChange,
  searchQuery,
  selectedCategory,
  sortBy,
  resultsCount
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    onSearch('');
    onCategoryChange('');
    onSortChange('ending_soon');
  };

  const hasActiveFilters = searchQuery || selectedCategory;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {resultsCount} auction{resultsCount !== 1 ? 's' : ''} found
          </span>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => onSearch('')}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  {categories.find(c => c.value === selectedCategory)?.label}
                  <button
                    onClick={() => onCategoryChange('')}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}