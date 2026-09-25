import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useAuth } from '../context/AuthContext';
import { Lock, User, LogIn, AlertCircle, Key, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user || sessionStorage.getItem('userToken')) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    background: {
      color: { value: '#000000' },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: 'push' },
        onHover: { enable: true, mode: 'repulse' },
        resize: true,
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: '#38bdf8' },
      links: { color: '#0284c7', distance: 150, enable: true, opacity: 0.25, width: 1 },
      move: { direction: 'none', enable: true, outModes: { default: 'bounce' }, speed: 1 },
      number: { density: { enable: true, area: 800 }, value: 70 },
      opacity: { value: 0.4 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please fill in both username and password.');
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-black overflow-hidden px-4">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm bg-zinc-950/90 backdrop-blur-xl rounded-xl shadow-lg border border-zinc-800 p-6">
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <img
              src="/intrams_logo.png"
              alt="INTRAMS 2026"
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.45)] hover:scale-105 transition-transform"
            />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Convenor Portal Login</h2>
          <p className="text-zinc-400 text-xs mt-1">Students' Union INTRAMS 2026 - Event Resource Management</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg p-3 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter club username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500">
            Forgot your password? Contact the Students Union administrator to reset your club credentials.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
