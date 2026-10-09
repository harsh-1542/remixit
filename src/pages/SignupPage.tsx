import React, { useState } from 'react';
import { useRouter, Link } from '../lib/router';
import { useAuth } from '../lib/auth-context';
import { BrandLogo } from '../components/BrandLogo';
import { ArrowRight, AlertCircle, Sparkles, Check } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { navigate } = useRouter();
  const { signUp, user } = useAuth();
  const [displayName, setDisplayName] = useState('');
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

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            Create your account
          </h1>
          <p className="text-xs text-zinc-500">
            Turn exceptional reference designs into original, working websites.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Benefits bullet callout */}
        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs text-zinc-600 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-800 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unlimited reference analyses & bookmarking</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-800 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Persistent cloud projects & version history</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-800 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clean React + Tailwind code exports</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Vance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-950 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1.5">
              Password (min. 6 characters)
            </label>
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
              <span>Creating account...</span>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center text-xs text-zinc-500">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="font-semibold text-zinc-950 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
