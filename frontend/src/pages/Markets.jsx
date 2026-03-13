import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import MarketCard from '../components/MarketCard.jsx';

const DEFAULT_CATEGORIES = ['Crypto', 'Politics', 'Sports', 'Technology', 'Entertainment'];

export default function Markets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'created_at';

  const markets = useQuery(api.markets.searchActive, {
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    sort_by: sortBy,
  });
  const dbCategories = useQuery(api.markets.getCategories) || [];
  const categories = [...new Set([...DEFAULT_CATEGORIES, ...dbCategories])].sort();

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Markets</h1>
        <p className="text-gray-600">Discover and trade on prediction markets for various events.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" value={search} onChange={e => updateFilter('search', e.target.value)}
            placeholder="Search markets..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          <select value={category} onChange={e => updateFilter('category', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => updateFilter('sort', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
            <option value="created_at">Newest First</option>
            <option value="end_date">Ending Soon</option>
            <option value="volume">Most Active</option>
          </select>
        </div>
      </div>

      {/* Markets Grid */}
      {markets === undefined ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : markets.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Markets Found</h3>
          <p className="text-gray-600">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map(m => <MarketCard key={m._id} market={{ ...m, id: m._id }} />)}
        </div>
      )}
    </div>
  );
}
