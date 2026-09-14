import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, PlusCircle, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

function NavBar({ showSidebarToggle = false, onToggleMobileMenu, mobileMenuOpen = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-black/95 backdrop-blur-xl border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-2xl w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Left side: Hamburger Toggle & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {showSidebarToggle && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-sky-400" /> : <Menu className="w-5 h-5 text-sky-400" />}
              </button>
            )}

            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0" onClick={() => navigate('/home')}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform text-xs sm:text-sm flex-shrink-0">
                <span>INT</span>
              </div>
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-2 truncate">
                  <h1 className="font-extrabold text-white leading-tight font-heading text-xs sm:text-base truncate">INTRAMS ERM</h1>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-bold flex-shrink-0">
                    2026
                  </span>
                </div>
                <p className="text-[10px] text-sky-400 font-mono hidden sm:block truncate">{user?.username || user?.club_name || 'Convenor Portal'}</p>
              </div>
            </div>
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/create-event')}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all flex-shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Create Proposal</span>
                  <span className="sm:hidden">Create</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
