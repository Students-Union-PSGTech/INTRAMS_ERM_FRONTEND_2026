import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api';

const labels = {
  connected: { text: 'BACKEND CONNECTED', dot: 'bg-[#00D084]', tone: 'text-[#00D084]' },
  offline: { text: 'OFFLINE', dot: 'bg-[#FF4D67]', tone: 'text-[#FF4D67]' },
  connecting: { text: 'CONNECTING', dot: 'bg-[#FFC107]', tone: 'text-[#FFC107]' },
};

export default function Header({ onToggleMobileMenu, mobileMenuOpen }) {
  const { user } = useAuth();
  const [health, setHealth] = useState('connecting');

  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      try {
        await adminAPI.checkHealth();
        if (mounted) setHealth('connected');
      } catch {
        if (mounted) setHealth('offline');
      }
    };

    ping();
    const interval = setInterval(ping, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const status = labels[health] || labels.connecting;

  return (
    <header className="fixed left-0 lg:left-[260px] right-0 top-0 z-30 h-[60px] border-b border-[#252525] bg-[#000000]/95 backdrop-blur-md">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile 3 Straight Lines Hamburger Menu Button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-[#FFFFFF] hover:text-[#00AEEF] hover:bg-[#0D0D0D] border border-[#252525] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <img
            src="/intrams_logo.png"
            alt="INTRAMS"
            className="h-7 sm:h-8 w-auto object-contain flex-shrink-0 drop-shadow-[0_0_8px_rgba(0,174,239,0.3)]"
          />
          <div className="min-w-0 truncate font-heading text-[13px] sm:text-[15px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#FFFFFF]">
            INTRAMS ERM ADMIN
          </div>
          {user?.username && (
            <span className="hidden min-w-0 truncate text-[12px] text-[#A0A0A0] uppercase font-bold md:inline-block">
              · {user.username}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase flex-shrink-0">
          <span className={`h-2 w-2 rounded-full ${status.dot} shadow-[0_0_8px_currentColor]`} />
          <span className={status.tone}>{status.text}</span>
        </div>
      </div>
    </header>
  );
}
