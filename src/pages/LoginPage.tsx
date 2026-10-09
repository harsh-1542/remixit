import React, { useState } from 'react';
import { useRouter, Link } from '../lib/router';
import { useAuth } from '../lib/auth-context';
import { BrandLogo } from '../components/BrandLogo';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 py-12 select-none">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="lg" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 font-sans mt-3">
            Sign in to your workspace
          </h1>
          <p className="text-xs text-zinc-500">
            Access your saved design references, generated websites, and project history.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Access Button */}
        <div>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                await signIn('demo@remix.design', 'password123');
                navigate('/dashboard');
              } catch (err: any) {
                setError(err.message || 'Demo login failed.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 transition-colors flex items-center justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span>1-Click Demo Login (Alex Vance)</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-700">Instant</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-zinc-200" />
            <span className="absolute bg-[#FAFAF8] px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              or with email
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs mt-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center text-xs text-zinc-500">
          <span>Don't have an account? </span>
          <Link
            to="/signup"
            className="font-semibold text-zinc-950 hover:underline underline-offset-4"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
