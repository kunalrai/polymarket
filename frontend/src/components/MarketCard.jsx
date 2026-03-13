import React from 'react';
import { Link } from 'react-router-dom';

function formatDate(iso) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatVolume(volume) {
  if (!volume) return '$0';
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export default function MarketCard({ market }) {
  const {
    id,
    title,
    description,
    end_date,
    price_yes,
    price_no,
    volume,
    category,
  } = market;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col overflow-hidden border border-gray-100">
      {/* Category badge */}
      <div className="px-5 pt-5 pb-0">
        {category && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full mb-2 uppercase tracking-wide">
            {category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-3 flex-1">
        <h3 className="text-blue-700 font-bold text-lg leading-snug mb-2 hover:text-blue-900">
          <Link to={`/market/${id}`}>{title}</Link>
        </h3>

        {end_date && (
          <div className="flex items-center text-gray-400 text-xs mb-2">
            <i className="fas fa-calendar-alt mr-1"></i>
            <span>Ends {formatDate(end_date)}</span>
          </div>
        )}

        {description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{description}</p>
        )}

        {/* Volume */}
        {volume !== undefined && (
          <div className="text-xs text-gray-400 mb-3">
            <i className="fas fa-chart-bar mr-1"></i>
            Volume: {formatVolume(volume)}
          </div>
        )}
      </div>

      {/* Price buttons */}
      <div className="px-5 pb-5">
        <div className="flex gap-2 mb-3">
          <Link
            to={`/market/${id}`}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            YES {price_yes !== undefined ? `${(price_yes * 100).toFixed(0)}¢` : ''}
          </Link>
          <Link
            to={`/market/${id}`}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-center py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            NO {price_no !== undefined ? `${(price_no * 100).toFixed(0)}¢` : ''}
          </Link>
        </div>
        <Link
          to={`/market/${id}`}
          className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Market <i className="fas fa-arrow-right ml-1 text-xs"></i>
        </Link>
      </div>
    </div>
  );
}
