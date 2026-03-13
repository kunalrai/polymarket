import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api.js';
import MarketCard from '../components/MarketCard.jsx';

const CATEGORIES = ['All Markets', 'Crypto', 'Politics', 'Sports', 'Technology', 'Entertainment'];

const HOW_IT_WORKS = [
  {
    icon: 'fa-search',
    title: 'Browse Markets',
    desc: 'Explore a wide range of prediction markets on politics, crypto, sports, and more.',
  },
  {
    icon: 'fa-lightbulb',
    title: 'Make Your Prediction',
    desc: 'Research the topic and decide whether you think the outcome will be YES or NO.',
  },
  {
    icon: 'fa-coins',
    title: 'Buy Shares',
    desc: 'Purchase YES or NO shares based on your prediction at the current market price.',
  },
  {
    icon: 'fa-trophy',
    title: 'Earn Rewards',
    desc: 'If your prediction is correct, your shares pay out at $1 each when the market resolves.',
  },
];

export default function Home() {
  const [markets, setMarkets] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Markets');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API('/markets/featured')
      .then(setMarkets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === 'All Markets'
      ? markets
      : markets.filter(
          (m) => m.category && m.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="text-white py-24 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Welcome to <span className="text-yellow-300">PredictMarket</span>
          </h1>
          <p className="text-lg md:text-xl text-purple-100 mb-8">
            Trade on the outcomes of real-world events. Use your knowledge to earn on politics,
            crypto, sports, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/markets"
              className="bg-white text-purple-700 hover:bg-yellow-300 hover:text-purple-900 font-bold px-8 py-3 rounded-xl text-lg transition-colors shadow-lg"
            >
              Explore Markets
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-700 font-bold px-8 py-3 rounded-xl text-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Category nav */}
      <section className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Markets */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Markets</h2>
          <Link to="/markets" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            View all <i className="fas fa-arrow-right ml-1"></i>
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <i className="fas fa-spinner fa-spin text-blue-600 text-3xl"></i>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <i className="fas fa-inbox text-5xl mb-4 block"></i>
            <p className="text-lg">No markets available in this category.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <i className={`fas ${step.icon} text-blue-600 text-2xl`}></i>
                </div>
                <div className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-1">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Start Trading?</h2>
          <p className="text-purple-100 mb-8 text-lg">
            Join thousands of traders using their knowledge to earn on real-world outcomes.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-purple-700 hover:bg-yellow-300 hover:text-purple-900 font-bold px-10 py-3 rounded-xl text-lg transition-colors shadow-lg"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
