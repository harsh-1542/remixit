import React from 'react';
import { BRAND } from '../config/branding';
import { Link } from '../lib/router';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  asLink = true,
}) => {
  const sizeClasses = {
    sm: 'text-lg tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-2xl sm:text-3xl tracking-tighter',
  };

  const content = (
    <span
      className={`font-semibold font-sans text-zinc-950 inline-flex items-baseline select-none transition-opacity hover:opacity-85 ${sizeClasses[size]} ${className}`}
    >
      <span>{BRAND.wordmark}</span>
    </span>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 rounded-sm" aria-label="Remix Home">
        {content}
      </Link>
    );
  }

  return content;
};
