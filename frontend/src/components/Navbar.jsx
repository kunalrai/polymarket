import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <i className="fas fa-chart-line text-blue-600 text-xl"></i>
            <span className="text-xl font-bold text-blue-600">PredictMarket</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/markets"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Explore Markets
            </Link>

            {user ? (
              <>
                {user.is_admin && (
                  <Link
                    to="/admin"
                    className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                  >
                    <i className="fas fa-shield-alt mr-1"></i>Admin
                  </Link>
                )}
                <span className="text-gray-500 text-sm truncate max-w-[160px]">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-600 hover:text-blue-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link
            to="/markets"
            className="block text-gray-600 hover:text-blue-600 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Explore Markets
          </Link>
          {user ? (
            <>
              {user.is_admin && (
                <Link
                  to="/admin"
                  className="block text-purple-600 font-medium py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <p className="text-gray-500 text-sm py-1">{user.email}</p>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="block w-full text-left text-gray-700 font-medium py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-gray-600 hover:text-blue-600 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block text-blue-600 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
