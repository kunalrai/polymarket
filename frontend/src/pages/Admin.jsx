import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function formatDate(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [markets, setMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [marketsError, setMarketsError] = useState('');

  // Create market form
  const [form, setForm] = useState({
    title: '', description: '', end_date: '', price_yes: '', price_no: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // BTC market
  const [btcLoading, setBtcLoading] = useState(false);
  const [btcMessage, setBtcMessage] = useState('');
  const [btcError, setBtcError] = useState('');

  const fetchMarkets = () => {
    setLoadingMarkets(true);
    API('/admin/markets')
      .then(setMarkets)
      .catch((e) => setMarketsError(e.message))
      .finally(() => setLoadingMarkets(false));
  };

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('/login');
      return;
    }
    fetchMarkets();
  }, [user, navigate]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);
    try {
      const data = await API('/admin/markets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          price_yes: parseFloat(form.price_yes),
          price_no: parseFloat(form.price_no),
        }),
      });
      setFormSuccess(data.message);
      setForm({ title: '', description: '', end_date: '', price_yes: '', price_no: '' });
      fetchMarkets();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleBtcMarket = async () => {
    setBtcLoading(true);
    setBtcMessage('');
    setBtcError('');
    try {
      const data = await API('/admin/btc-market', { method: 'POST' });
      if (data.success) {
        setBtcMessage(`Created: "${data.market.title}"`);
        fetchMarkets();
      } else {
        setBtcError(data.message || 'Failed to create BTC market');
      }
    } catch (err) {
      setBtcError(err.message);
    } finally {
      setBtcLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-white">
          <div className="flex items-center gap-3 mb-1">
            <i className="fas fa-shield-alt text-3xl text-yellow-300"></i>
            <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
          </div>
          <p className="text-purple-200">Manage prediction markets</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Create market form */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-6 h-full"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <h2 className="text-xl font-bold text-white mb-5">
                <i className="fas fa-plus-circle mr-2 text-yellow-300"></i>Create Market
              </h2>

              {formError && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg mb-4 text-sm">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleCreateMarket} className="space-y-4">
                {[
                  { name: 'title', label: 'Market Title', type: 'text', placeholder: 'Will X happen by Y?' },
                  { name: 'description', label: 'Description', type: 'text', placeholder: 'Describe the resolution criteria' },
                  { name: 'end_date', label: 'End Date', type: 'date', placeholder: '' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-purple-100 text-sm font-medium mb-1">
                      {field.label}
                    </label>
                    {field.name === 'description' ? (
                      <textarea
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleFormChange}
                        required
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full bg-white/20 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleFormChange}
                        required
                        placeholder={field.placeholder}
                        className="w-full bg-white/20 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                      />
                    )}
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-100 text-sm font-medium mb-1">
                      YES Price (0–1)
                    </label>
                    <input
                      type="number"
                      name="price_yes"
                      value={form.price_yes}
                      onChange={handleFormChange}
                      required
                      min="0.01"
                      max="0.99"
                      step="0.01"
                      placeholder="0.50"
                      className="w-full bg-white/20 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-100 text-sm font-medium mb-1">
                      NO Price (0–1)
                    </label>
                    <input
                      type="number"
                      name="price_no"
                      value={form.price_no}
                      onChange={handleFormChange}
                      required
                      min="0.01"
                      max="0.99"
                      step="0.01"
                      placeholder="0.50"
                      className="w-full bg-white/20 text-white placeholder-purple-200 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-purple-900 font-bold py-2.5 rounded-lg transition-colors"
                >
                  {formLoading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>
                  ) : (
                    'Create Market'
                  )}
                </button>
              </form>

              {/* BTC market */}
              <div className="mt-6 pt-5 border-t border-white/20">
                <h3 className="text-white font-semibold mb-3">
                  <i className="fab fa-bitcoin mr-2 text-yellow-300"></i>BTC Auto-Market
                </h3>
                {btcError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                    {btcError}
                  </div>
                )}
                {btcMessage && (
                  <div className="bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm">
                    {btcMessage}
                  </div>
                )}
                <button
                  onClick={handleBtcMarket}
                  disabled={btcLoading}
                  className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors"
                >
                  {btcLoading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Fetching BTC data...</>
                  ) : (
                    <><i className="fab fa-bitcoin mr-2"></i>Generate BTC Market</>
                  )}
                </button>
                <p className="text-purple-200 text-xs mt-2">
                  Fetches live BTC price from CoinGecko and creates a market automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Markets list */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <h2 className="text-xl font-bold text-white mb-5">
                <i className="fas fa-list mr-2 text-yellow-300"></i>
                All Markets
                <span className="ml-2 text-purple-200 font-normal text-base">
                  ({markets.length})
                </span>
              </h2>

              {loadingMarkets && (
                <div className="flex justify-center py-12">
                  <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                </div>
              )}
              {marketsError && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {marketsError}
                </div>
              )}

              {!loadingMarkets && !marketsError && markets.length === 0 && (
                <p className="text-purple-200 text-center py-8">No markets yet.</p>
              )}

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/market/${market.id}`}
                          className="text-white font-semibold hover:text-yellow-300 transition-colors line-clamp-2"
                        >
                          {market.title}
                        </Link>
                        <p className="text-purple-200 text-xs mt-1 line-clamp-1">
                          {market.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex gap-1 mb-1">
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                            YES {market.price_yes !== undefined ? `${Math.round(market.price_yes * 100)}¢` : ''}
                          </span>
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                            NO {market.price_no !== undefined ? `${Math.round(market.price_no * 100)}¢` : ''}
                          </span>
                        </div>
                        <p className="text-purple-300 text-xs">
                          Ends {formatDate(market.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
