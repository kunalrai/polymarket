import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

function daysUntil(ms) {
  const diff = ms - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h left`;
}

function StatusBadge({ status, outcome }) {
  if (status === 'resolved') {
    const color = outcome === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${color}`}>Resolved: {outcome?.toUpperCase()}</span>;
  }
  return <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>;
}

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  const market = useQuery(api.markets.getById, { id });
  const trades = useQuery(api.trades.getByMarket, { market_id: id });
  const executeTrade = useMutation(api.trades.create);

  const [tab, setTab] = useState('yes');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTrade = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) { setError('Enter a valid amount'); return; }
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const price = tab === 'yes' ? market.price_yes : market.price_no;
      await executeTrade({ market_id: id, share_type: tab, amount: qty, price_at_trade: price });
      setSuccess(`Bought ${qty} ${tab.toUpperCase()} shares at $${price.toFixed(2)}`);
      setAmount('');
    } catch (err) {
      setError(err.message || 'Trade failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (market === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }
  if (market === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl font-semibold text-gray-700 mb-4">Market not found</p>
        <Link to="/markets" className="text-indigo-600 hover:underline">Back to markets</Link>
      </div>
    );
  }

  const yesProb = Math.round(market.price_yes * 100);
  const noProb = Math.round(market.price_no * 100);
  const isResolved = market.status === 'resolved';
  const price = tab === 'yes' ? market.price_yes : market.price_no;
  const estCost = amount && parseFloat(amount) > 0 ? (parseFloat(amount) * price).toFixed(2) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/markets" className="hover:text-indigo-600">Markets</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium truncate">{market.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {market.category && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  {market.category}
                </span>
              )}
              <StatusBadge status={market.status} outcome={market.outcome} />
              <span className="text-xs text-gray-500 ml-auto">{daysUntil(market.end_date)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{market.title}</h1>
            {market.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{market.description}</p>
            )}
            <div className="mt-4 text-xs text-gray-400">
              Closes {new Date(market.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Probability bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Current Probability</h2>
            <div className="flex rounded-full overflow-hidden h-6 mb-3">
              <div
                className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                style={{ width: `${yesProb}%` }}
              >
                {yesProb >= 15 ? `${yesProb}%` : ''}
              </div>
              <div
                className="bg-rose-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                style={{ width: `${noProb}%` }}
              >
                {noProb >= 15 ? `${noProb}%` : ''}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-emerald-600">Yes &nbsp;{yesProb}%</span>
              <span className="font-semibold text-rose-600">{noProb}% &nbsp;No</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Volume', value: `$${(market.volume || 0).toLocaleString()}` },
              { label: 'Trades', value: trades?.length ?? '—' },
              { label: 'Closes', value: new Date(market.end_date).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <div className="text-lg font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Trade history */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Trades</h2>
            {trades === undefined ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : trades.length === 0 ? (
              <p className="text-gray-400 text-sm">No trades yet. Be the first!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b">
                      <th className="text-left pb-2 font-medium">Time</th>
                      <th className="text-left pb-2 font-medium">Side</th>
                      <th className="text-right pb-2 font-medium">Amount</th>
                      <th className="text-right pb-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {trades.slice(0, 20).map(t => (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-500">
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-gray-300 ml-1 text-xs">
                            {new Date(t.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`font-semibold ${t.share_type === 'yes' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.share_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 text-right text-gray-700">{t.amount}</td>
                        <td className="py-2 text-right text-gray-700">${t.price_at_trade.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column — Trade panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Place Order</h2>

            {isResolved ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                This market has been resolved.
              </div>
            ) : (
              <>
                {/* Yes / No tabs */}
                <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
                  <button
                    onClick={() => setTab('yes')}
                    className={`flex-1 py-2 text-sm font-semibold transition ${
                      tab === 'yes'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Yes &nbsp;{yesProb}¢
                  </button>
                  <button
                    onClick={() => setTab('no')}
                    className={`flex-1 py-2 text-sm font-semibold transition ${
                      tab === 'no'
                        ? 'bg-rose-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    No &nbsp;{noProb}¢
                  </button>
                </div>

                {/* Amount input */}
                <label className="block text-xs font-medium text-gray-500 mb-1">Shares</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4"
                />

                {/* Cost estimate */}
                <div className="flex justify-between text-sm text-gray-500 mb-5">
                  <span>Price per share</span>
                  <span className="font-medium text-gray-800">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-5">
                  <span>Estimated cost</span>
                  <span className="font-semibold text-gray-900">{estCost ? `$${estCost}` : '—'}</span>
                </div>

                {/* Feedback */}
                {error && (
                  <div className="mb-3 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm">{error}</div>
                )}
                {success && (
                  <div className="mb-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm">{success}</div>
                )}

                {/* Buy button */}
                <button
                  onClick={handleTrade}
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 ${
                    tab === 'yes'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {submitting ? 'Placing order…' : `Buy ${tab.toUpperCase()}`}
                </button>

                {!isAuthenticated && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link> to trade
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
