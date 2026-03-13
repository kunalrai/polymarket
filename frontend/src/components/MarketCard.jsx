import React from 'react';
import { Link } from 'react-router-dom';

export default function MarketCard({ market }) {
  const endDate = market.end_date
    ? new Date(market.end_date).toLocaleDateString()
    : '';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between h-full transition hover:-translate-y-1 hover:shadow-xl">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-blue-700 hover:underline flex-1 mr-2">
            <Link to={`/market/${market.id || market._id}`}>{market.title}</Link>
          </h3>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap">
            {endDate}
          </span>
        </div>
        {market.category && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mb-2 inline-block">
            {market.category}
          </span>
        )}
        <p className="text-gray-600 text-sm mb-4">{market.description}</p>
      </div>
      <div>
        <div className="flex justify-between gap-3 mb-3">
          <div className="flex-1 bg-green-500 text-white text-center py-2 rounded-md font-semibold text-sm">
            Yes: {market.price_yes || '0.00'}
          </div>
          <div className="flex-1 bg-red-500 text-white text-center py-2 rounded-md font-semibold text-sm">
            No: {market.price_no || '0.00'}
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>Volume: {market.volume || 0}</span>
        </div>
        <Link
          to={`/market/${market.id || market._id}`}
          className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md shadow transition"
        >
          View Market
        </Link>
      </div>
    </div>
  );
}
