import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function formatDate(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MarketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [market, setMarket] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trade form state
  const [amount, setAmount] = useState('');
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);

  useEffect(() => {
    API(`/markets/${id}`)
      .then((data) => {
        setMarket(data.market);
        setTrades(data.trades || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTrade = async (shareType) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setTradeError('Please enter a valid amount greater than 0');
      return;
    }
    setTradeError('');
    setTradeSuccess('');
    setTradeLoading(true);
    try {
      const data = await API(`/trade/${id}/${shareType}`, {
        method: 'POST',
        body: JSON.stringify({ amount: amt }),
      });
      setTradeSuccess(data.message);
      setAmount('');
      // Refresh trades
      API(`/markets/${id}`).then((d) => setTrades(d.trades || [])).catch(() => {});
    } catch (err) {
      setTradeError(err.message);
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <i className="fas fa-spinner fa-spin text-blue-600 text-4xl"></i>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <i className="fas fa-exclamation-triangle text-red-400 text-5xl mb-4 block"></i>
        <p className="text-red-600 text-lg">{error || 'Market not found'}</p>
        <Link to="/markets" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          &larr; Back to Markets
        </Link>
      </div>
    );
  }

  const yesPercent = market.price_yes ? Math.round(market.price_yes * 100) : 0;
  const noPercent = market.price_no ? Math.round(market.price_no * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/markets" className="hover:text-blue-600">Markets</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600 truncate">{market.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Market header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {market.category && (
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full mb-3 uppercase tracking-wide">
                  {market.category}
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-800 mb-3">{market.title}</h1>
              {market.description && (
                <p className="text-gray-600 leading-relaxed mb-4">{market.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {market.end_date && (
                  <span>
                    <i className="fas fa-calendar-alt mr-1"></i>
                    Ends {formatDate(market.end_date)}
                  </span>
                )}
                {market.volume !== undefined && (
                  <span>
                    <i className="fas fa-chart-bar mr-1"></i>
                    Volume: ${market.volume?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>

            {/* Probability bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Current Probabilities</h2>
              <div className="flex rounded-full overflow-hidden h-6 mb-3">
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${yesPercent}%` }}
                >
                  {yesPercent > 10 ? `${yesPercent}%` : ''}
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${noPercent}%` }}
                >
                  {noPercent > 10 ? `${noPercent}%` : ''}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-semibold">YES — {yesPercent}¢</span>
                <span className="text-red-600 font-semibold">NO — {noPercent}¢</span>
              </div>
            </div>

            {/* Trade History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-700 mb-4">
                Trade History
                <span className="ml-2 text-gray-400 font-normal text-sm">({trades.length})</span>
              </h2>
              {trades.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No trades yet. Be the first!</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {trades.map((trade, i) => (
                    <div
                      key={trade.id || i}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 ${
                            trade.share_type === 'yes'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {trade.share_type?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {trade.amount} shares @ ${trade.price_at_trade}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {trade.timestamp ? formatDateTime(trade.timestamp) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Trade panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Place a Trade</h2>

              {!user && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mb-4">
                  <Link to="/login" className="font-medium underline">Log in</Link> to trade on this market.
                </div>
              )}

              {tradeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                  {tradeError}
                </div>
              )}
              {tradeSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm mb-3">
                  {tradeSuccess}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleTrade('yes')}
                  disabled={tradeLoading || !user}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {tradeLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>Buy YES — {yesPercent}¢</>
                  )}
                </button>
                <button
                  onClick={() => handleTrade('no')}
                  disabled={tradeLoading || !user}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {tradeLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>Buy NO — {noPercent}¢</>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Shares pay out $1 each if prediction is correct.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
