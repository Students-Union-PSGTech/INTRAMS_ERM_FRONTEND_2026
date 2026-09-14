import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, FileText, Edit3, ShieldCheck, LogOut, X } from 'lucide-react';

function Sidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/home', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/create-event', label: 'Create Proposal', icon: PlusCircle },
    { to: '/view-events', label: 'My Proposals', icon: FileText },
    { to: '/edit', label: 'Edit Access', icon: Edit3 },
    { to: '/lab-confirmation', label: 'Lab Confirmations', icon: ShieldCheck },
  ];

  return (
    <aside className="w-full h-full bg-slate-950/90 border-r border-slate-800/80 text-white flex flex-col justify-between p-5 font-sans backdrop-blur-2xl shadow-2xl overflow-y-auto">
      <div>
        {/* Header */}
        <div className="pb-5 mb-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight font-heading">
              CONVENOR<br />
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">PORTAL</span>
            </h2>
            {user?.username && (
              <div className="mt-3 px-3 py-1.5 bg-slate-900/90 border border-sky-500/30 rounded-xl inline-flex items-center gap-2 max-w-full overflow-hidden shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="text-xs font-mono font-bold text-sky-400 truncate uppercase tracking-wider">
                  {user.username}
                </span>
              </div>
            )}
          </div>
          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation Items */}
        <nav className="space-y-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={mobile ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 w-full px-4 py-3 border text-xs font-bold tracking-wide transition-all rounded-xl text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-sky-500/60 text-sky-300 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="font-semibold">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Logout Button */}
      <div className="pt-4 mt-6 border-t border-slate-800/80">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2.5 w-full px-4 py-3 bg-slate-900/80 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-bold tracking-wide transition-all rounded-xl shadow-md"
        >
          <LogOut className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
