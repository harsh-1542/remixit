import React, { useState } from 'react';
import { useRouter } from '../lib/router';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BRAND } from '../config/branding';

interface ReferenceInputProps {
  initialValue?: string;
  onAnalyze?: (url: string) => void;
  buttonLabel?: string;
  variant?: 'hero' | 'build';
}

export const ReferenceInput: React.FC<ReferenceInputProps> = ({
  initialValue = '',
  onAnalyze,
  buttonLabel,
  variant = 'hero',
}) => {
  const { navigate } = useRouter();
  const [url, setUrl] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();

    if (onAnalyze) {
      onAnalyze(cleanUrl);
      return;
    }

    // Default hero behavior: navigate to /build
    if (cleanUrl) {
      navigate(`/build?url=${encodeURIComponent(cleanUrl)}`);
    } else {
      navigate('/build');
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border rounded-xl p-1.5 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
            error
              ? 'border-red-400 ring-2 ring-red-100'
              : 'border-zinc-300 focus-within:border-zinc-900 focus-within:ring-3 focus-within:ring-zinc-900/10'
          }`}
        >
          {/* Prefix indicator */}
          <div className="hidden sm:flex items-center pl-3 pr-1 text-zinc-400 text-xs font-mono select-none">
            https://
          </div>

          {/* URL Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              isHero ? BRAND.heroInputPlaceholder : 'https://example.com'
            }
            aria-label="Website reference URL"
            className="flex-1 px-3 sm:px-2 py-2.5 sm:py-2 text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 bg-transparent border-0 focus:outline-none"
          />

          {/* Action button */}
          <button
            type="submit"
            className="mt-1.5 sm:mt-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 shadow-sm shrink-0"
          >
            {isHero ? (
              <>
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <span>Build Similar</span>
              </>
            ) : (
              <>
                <span>{buttonLabel || 'Analyze Website'}</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Subtext below input */}
      {isHero && (
        <p className="text-center text-xs text-zinc-500 mt-2.5 font-normal tracking-normal">
          {BRAND.heroInputSubtext}
        </p>
      )}
    </div>
  );
};
