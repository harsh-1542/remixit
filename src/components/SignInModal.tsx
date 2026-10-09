import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, AlertCircle, Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../lib/auth-context';
import { useRouter } from '../lib/router';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  message?: string;
  onSuccess?: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  message,
  onSuccess,
}) => {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn('demo@remix.design', 'password123');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <BrandLogo size="md" asLink={false} />
        </div>

        <div>
          <h3 className="text-xl font-bold text-zinc-950 tracking-tight font-sans">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your Remix account'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {message ||
              (mode === 'signin'
                ? 'Save custom design references, manage generated websites, and track project versions.'
                : 'Start turning great reference designs into original, full-stack websites.')}
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Access Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-800 transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span>1-Click Demo Login (Alex Vance)</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-700">Instant</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-zinc-200" />
            <span className="absolute bg-white px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              or with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sarah Chen"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-medium">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/forgot-password');
                  }}
                  className="text-[10px] font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign in' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-zinc-500 pt-3 border-t border-zinc-100">
          {mode === 'signin' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="font-semibold text-zinc-950 hover:underline underline-offset-4 cursor-pointer"
              >
                Create one now
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signin');
                }}
                className="font-semibold text-zinc-950 hover:underline underline-offset-4 cursor-pointer"
              >
                Sign in instead
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
