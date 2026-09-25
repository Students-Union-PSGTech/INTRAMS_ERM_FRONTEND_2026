import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedNetworkBackground from './layout/AnimatedNetworkBackground';
import Button from './ui/Button';
import Input from './ui/Input';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user || sessionStorage.getItem('token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Enter both username and password.');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
      return;
    }

    setError(result.error || 'Invalid username or password');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#000000] px-4">
      <AnimatedNetworkBackground />

      <div className="relative z-10 w-full max-w-[440px] border border-[#252525] bg-[#050505] p-8 shadow-[0_0_40px_rgba(0,174,239,0.12)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <img
              src="/intrams_logo.png"
              alt="INTRAMS 2026"
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(0,174,239,0.4)] hover:scale-105 transition-transform"
            />
          </div>
          <div className="font-heading text-[20px] font-bold uppercase tracking-[0.2em] text-[#FFFFFF]">INTRAMS 2026</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[#00AEEF]">ADMIN PORTAL</div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 border border-[#FF4D67]/40 bg-[#000000] p-3 text-[12px] font-bold text-[#FF4D67]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D67]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#E5E5E5]">USERNAME</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="w-full border border-[#252525] bg-[#000000] pl-10 pr-3 py-2.5 text-[#FFFFFF] text-[13px] outline-none transition-colors focus:border-[#00AEEF]"
                placeholder="ENTER USERNAME"
              />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#E5E5E5]">PASSWORD</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full border border-[#252525] bg-[#000000] pl-10 pr-10 py-2.5 text-[#FFFFFF] text-[13px] outline-none transition-colors focus:border-[#00AEEF]"
                placeholder="ENTER PASSWORD"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] transition hover:text-[#00AEEF]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="mt-4 w-full py-3 text-[12px] font-bold uppercase tracking-[0.2em]">
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </Button>
        </form>
      </div>
    </div>
  );
}