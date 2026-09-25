import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-4 text-white shadow-xl flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <img
          src="/intrams_logo.png"
          alt="INTRAMS 2026"
          className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
        />
        <div>
          <h1 className="text-lg font-bold text-white font-heading leading-tight">INTRAMS Admin Portal</h1>
          <p className="text-xs text-sky-300/70">{user?.username || 'Administrator'}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-sm font-semibold text-slate-200 transition-colors"
      >
        <LogOut className="w-4 h-4 text-slate-400" /> Logout
      </button>
    </header>
  );
}

export default Navbar;
