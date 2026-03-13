import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api.js';
import MarketCard from '../components/MarketCard.jsx';

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'end_date', label: 'Ending Soon' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'price_yes', label: 'Price (Yes)' },
];

export default function Markets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [markets, setMarkets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'created_at';

  const fetchMarkets = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ search, category, sort });
    API(`/markets?${params}`)
      .then((data) => {
        setMarkets(data.markets || []);
        setCategories(data.categories || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Explore Markets</h1>
          <p className="text-gray-500 mt-1">Browse and trade on prediction markets</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                placeholder="Search markets..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-[160px]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-[160px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-20">
            <i className="fas fa-spinner fa-spin text-blue-600 text-3xl"></i>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-gray-500 text-sm mb-4">
              {markets.length} market{markets.length !== 1 ? 's' : ''} found
            </p>
            {markets.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <i className="fas fa-search text-5xl mb-4 block"></i>
                <p className="text-lg">No markets match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
