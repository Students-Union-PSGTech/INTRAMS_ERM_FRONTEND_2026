import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  Warehouse,
  Gift,
  History,
  ShoppingCart,
  ShieldCheck,
  FlaskConical,
  LogOut,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

function Section({ title, children }) {
  return (
    <div className="mt-4">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0] font-heading">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Item({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-none border px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-all ${
          isActive
            ? 'border-[#00AEEF] bg-[#00AEEF] text-[#000000] shadow-[0_0_12px_rgba(0,174,239,0.35)]'
            : 'border-[#252525] bg-[#050505] text-[#E5E5E5] hover:border-[#00AEEF] hover:bg-[#0D0D0D] hover:text-[#FFFFFF]'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="leading-none">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ onItemClick, onClose, isMobile = false }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || localStorage.getItem('role') || 'admin';

  const handleLogout = async () => {
    if (onItemClick) onItemClick();
    await logout();
    navigate('/login');
  };

  const username = (user?.username || 'ADMIN').toUpperCase();
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col bg-[#050505] border-r border-[#252525] text-[#FFFFFF]">
      <div className="border-b border-[#252525] px-5 py-4 bg-[#000000] flex items-center justify-between">
        <div>
          <div className="font-heading text-[18px] font-bold tracking-[0.16em] text-[#FFFFFF]">INTRAMS</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#00AEEF]">ADMIN PORTAL</div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] border border-[#252525] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <Item to="/dashboard" icon={LayoutDashboard} label="DASHBOARD" onClick={onItemClick} />

        <Section title="OPERATIONS">
          <Item to="/associations" icon={Users} label="CLUBS" onClick={onItemClick} />
          <Item to="/events" icon={Calendar} label="EVENTS" onClick={onItemClick} />
          <Item to="/items" icon={Package} label="ITEMS" onClick={onItemClick} />
          <Item to="/inventory" icon={Warehouse} label="INVENTORY" onClick={onItemClick} />
          <Item to="/grant-allocation" icon={Gift} label="GRANT ALLOCATION" onClick={onItemClick} />
          <Item to="/grant-history" icon={History} label="GRANT HISTORY" onClick={onItemClick} />
          <Item to="/procurement" icon={ShoppingCart} label="PROCUREMENT" onClick={onItemClick} />
        </Section>

        <Section title="ADMINISTRATION">
          <Item to="/edit-access" icon={ShieldCheck} label="EDIT ACCESS" onClick={onItemClick} />
          <Item to="/lab-confirmation" icon={FlaskConical} label="LAB CONFIRMATION" onClick={onItemClick} />
          <Item to="/role-reports" icon={FileText} label="ROLE PDF" onClick={onItemClick} />
        </Section>
      </nav>

      <div className="border-t border-[#252525] p-4 bg-[#000000]">
        <div className="flex items-center gap-3 border border-[#252525] bg-[#080808] px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center border border-[#00AEEF] bg-[#050505] text-[11px] font-bold text-[#00AEEF]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-[#FFFFFF]">{username}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A0A0A0]">{role}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="mt-3 w-full justify-start text-[#E5E5E5] hover:text-[#FFFFFF] border border-[#252525] hover:border-[#FF4D67]"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-[#FF4D67]" />
          LOGOUT
        </Button>
      </div>
    </div>
  );
}
