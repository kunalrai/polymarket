import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import MarketCard from '../components/MarketCard.jsx';

export default function Home() {
  const markets = useQuery(api.markets.getActive);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category Nav */}
      <div className="bg-white shadow-sm mb-8 -mx-4 px-4 overflow-x-auto">
        <div className="flex items-center space-x-8 py-4 text-gray-600 whitespace-nowrap">
          {[
            ['fa-globe', 'All Markets', '/markets'],
            ['fab fa-bitcoin', 'Crypto', '/markets?category=Crypto'],
            ['fa-landmark', 'Politics', '/markets?category=Politics'],
            ['fa-futbol', 'Sports', '/markets?category=Sports'],
            ['fa-microchip', 'Technology', '/markets?category=Technology'],
            ['fa-film', 'Entertainment', '/markets?category=Entertainment'],
          ].map(([icon, label, href]) => (
            <Link key={label} to={href} className="flex items-center space-x-2 hover:text-blue-600 transition">
              <i className={`fas ${icon} text-lg`}></i>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section
        className="min-h-[400px] py-20 px-6 rounded-3xl shadow-lg relative overflow-hidden mb-20"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="text-center relative z-10">
          <h1 className="text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
            Welcome to PredictMarket
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-light">
            Trade on real-world events. Make smart predictions. Earn rewards.
          </p>
          <Link
            to="/markets"
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 rounded-xl shadow-lg transition transform hover:scale-105 inline-block"
          >
            Explore Markets
          </Link>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-2">
          <span>🔥</span> Featured Markets
        </h2>
        {markets === undefined ? (
          <div className="text-center text-gray-500 py-12">Loading markets...</div>
        ) : markets.length === 0 ? (
          <div className="bg-white rounded-lg p-6 shadow text-center text-gray-600">
            No featured markets available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {markets.map((market) => (
              <MarketCard key={market._id} market={{ ...market, id: market._id }} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          {[
            ['fa-user-plus', 'Sign Up', 'Create your account securely.'],
            ['fa-search-dollar', 'Browse Markets', 'View current topics and upcoming event markets.'],
            ['fa-hand-holding-usd', 'Buy Shares', 'Select your side — "Yes" or "No" — and invest.'],
            ['fa-trophy', 'Win & Earn', 'Correct predictions get paid when markets resolve.'],
          ].map(([icon, title, desc], i) => (
            <div key={title} className="bg-white p-6 rounded-xl shadow hover:scale-105 transition">
              <i className={`fas ${icon} text-3xl text-indigo-500 mb-4`}></i>
              <h3 className="text-lg font-semibold mb-2">{i + 1}. {title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center mb-12">
        <p className="text-xl text-gray-800 font-medium mb-4">Ready to test your insights?</p>
        <Link
          to="/register"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition inline-block"
        >
          Create an Account
        </Link>
      </section>
    </div>
  );
}
