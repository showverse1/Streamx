import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ShieldCheck, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, loginWithGoogle, haptic } = useAppStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Login failed. Please check credentials.');
      } else {
        haptic(50);
      }
    } else {
      const res = await register(email, password, name);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Please check your details.');
      } else {
        haptic(60);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    haptic(40);
    setIsLoading(true);
    setErrorMessage(null);
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Google sign-in could not be completed.');
    }
  };

  const handleDemoLogin = async () => {
    haptic(40);
    setIsLoading(true);
    setErrorMessage(null);
    const res = await login('user@streamx.app', 'streamx123');
    if (!res.success) {
      // If demo user doesn't exist yet on Firebase, auto-register
      const regRes = await register('user@streamx.app', 'streamx123', 'Demo Member');
      if (!regRes.success) {
        setErrorMessage(regRes.error || 'Demo login failed.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl shadow-black text-slate-100 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {mode === 'login' ? 'StreamX Account Login' : 'Create StreamX Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'login' ? 'Sign in with your email & password' : 'Join StreamX to sync watch history'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic(25);
              setIsAuthModalOpen(false);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              haptic(30);
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              haptic(30);
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-800" />
          <span className="bg-slate-900 px-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold absolute">
            Or continue with
          </span>
        </div>

        {/* Google & Demo Auth buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo Account (1-Click)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
