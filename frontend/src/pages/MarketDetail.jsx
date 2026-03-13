import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  const market = useQuery(api.markets.getById, { id });
  const trades = useQuery(api.trades.getByMarket, { market_id: id });
  const executeTrade = useMutation(api.trades.create);

  const [amounts, setAmounts] = useState({ yes: '', no: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTrade = async (shareType) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const amount = parseFloat(amounts[shareType]);
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }

    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const price = shareType === 'yes' ? market.price_yes : market.price_no;
      await executeTrade({ market_id: id, share_type: shareType, amount, price_at_trade: price });
      setSuccess(`Bought ${amount} ${shareType.toUpperCase()} shares at $${price}`);
      setAmounts({ yes: '', no: '' });
    } catch (err) {
      setError(err.message || 'Trade failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (market === undefined) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (market === null) return <div className="text-center py-12 text-red-500">Market not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">{market.title}</h1>
        <p className="text-gray-700 mb-4">{market.description}</p>
        <div className="text-sm text-gray-500 mb-6">
          <strong>Market Ends:</strong> {new Date(market.end_date).toLocaleDateString()}
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded text-center">
            <h2 className="text-lg font-semibold text-blue-700">Yes Price</h2>
            <p className="text-2xl font-bold text-blue-900">${market.price_yes}</p>
          </div>
          <div className="bg-red-100 p-4 rounded text-center">
            <h2 className="text-lg font-semibold text-red-700">No Price</h2>
            <p className="text-2xl font-bold text-red-900">${market.price_no}</p>
          </div>
        </div>

        {/* Trade */}
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 text-sm">{error}</div>}
        {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded px-4 py-2 text-sm">{success}</div>}
        <div className="flex space-x-4 mb-8">
          <div className="flex flex-col items-center gap-2">
            <input type="number" value={amounts.yes} onChange={e => setAmounts(a => ({...a, yes: e.target.value}))}
              className="border rounded px-3 py-2 w-32" placeholder="Amount" min="1" />
            <button onClick={() => handleTrade('yes')} disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded shadow">
              Buy Yes
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <input type="number" value={amounts.no} onChange={e => setAmounts(a => ({...a, no: e.target.value}))}
              className="border rounded px-3 py-2 w-32" placeholder="Amount" min="1" />
            <button onClick={() => handleTrade('no')} disabled={submitting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded shadow">
              Buy No
            </button>
          </div>
        </div>

        {/* Trade History */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Trading History</h3>
          {trades === undefined ? <p className="text-gray-500">Loading...</p> :
           trades.length === 0 ? <p className="text-gray-500">No trades yet.</p> : (
            <ul className="divide-y divide-gray-200">
              {trades.map(t => (
                <li key={t._id} className="py-2 flex justify-between text-sm">
                  <span>{new Date(t.created_at).toLocaleString()}</span>
                  <span>{t.user_id} — {t.share_type} @ {t.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
