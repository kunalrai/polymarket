import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function Admin() {
  const markets = useQuery(api.markets.getAll);
  const createMarket = useMutation(api.markets.create);
  const createBtcMarket = useAction(api.markets.createBtcMarket);

  const [form, setForm] = useState({ title: '', description: '', end_date: '', price_yes: '', price_no: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [btcLoading, setBtcLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await createMarket({
        title: form.title,
        description: form.description,
        end_date: new Date(form.end_date).getTime(),
        price_yes: parseFloat(form.price_yes),
        price_no: parseFloat(form.price_no),
      });
      setSuccess('Market created successfully!');
      setForm({ title: '', description: '', end_date: '', price_yes: '', price_no: '' });
    } catch (err) {
      setError(err.message || 'Failed to create market');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBtcMarket = async () => {
    setBtcLoading(true); setError(''); setSuccess('');
    try {
      const result = await createBtcMarket({});
      setSuccess(`BTC market created: ${result.title}`);
    } catch (err) {
      setError(err.message || 'Failed to create BTC market');
    } finally {
      setBtcLoading(false);
    }
  };

  const inputClass = "w-full p-4 border-2 border-indigo-100 rounded-xl text-base focus:outline-none focus:border-indigo-500 bg-white/80 transition";

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-white mb-4">🛠️ Admin Control Panel</h1>
          <p className="text-xl text-white/90 font-light">Create and manage prediction markets</p>
        </div>

        {/* Form */}
        <div className="bg-white/95 rounded-2xl p-10 mb-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">✨ Create New Market</h2>
          {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 text-sm">{error}</div>}
          {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded px-4 py-2 text-sm">{success}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input className={inputClass} placeholder="Market Title" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
            <input className={inputClass} placeholder="Description" required value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            <input type="date" className={inputClass} required value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
            <input type="number" step="0.01" className={inputClass} placeholder="Yes Price (e.g. 0.55)" required value={form.price_yes} onChange={e => setForm(f => ({...f, price_yes: e.target.value}))} />
            <input type="number" step="0.01" className={inputClass} placeholder="No Price (e.g. 0.45)" required value={form.price_no} onChange={e => setForm(f => ({...f, price_no: e.target.value}))} />
            <button type="submit" disabled={submitting}
              className="md:col-span-2 w-full p-5 rounded-xl font-semibold text-white text-lg disabled:opacity-50 transition"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              {submitting ? 'Creating...' : 'Create Market'}
            </button>
            <button type="button" onClick={handleBtcMarket} disabled={btcLoading}
              className="md:col-span-2 w-full p-5 rounded-xl font-semibold text-white text-lg disabled:opacity-50 transition"
              style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
              {btcLoading ? 'Fetching BTC price...' : '🚀 Create BTC Market from CoinGecko'}
            </button>
          </form>
        </div>

        {/* Markets List */}
        <h3 className="text-2xl font-bold text-white mb-6">📊 All Markets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {markets === undefined ? (
            <p className="text-white/70">Loading...</p>
          ) : markets.map(m => (
            <div key={m._id} className="bg-white/95 rounded-2xl p-6 border border-white/30 hover:-translate-y-1 hover:shadow-xl transition">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-gray-800 flex-1 mr-2">{m.title}</h4>
                <span className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full whitespace-nowrap">
                  {new Date(m.end_date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{m.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-lg text-center font-semibold text-sm">
                  Yes: {m.price_yes.toFixed(2)}
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg text-center font-semibold text-sm">
                  No: {m.price_no.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
