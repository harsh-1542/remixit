import React from 'react';
import { Website } from '../types';
import { WebsiteCard } from './WebsiteCard';

interface WebsiteGridProps {
  websites: Website[];
  allowFeaturedSpans?: boolean;
}

export const WebsiteGrid: React.FC<WebsiteGridProps> = ({
  websites,
  allowFeaturedSpans = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {websites.map((website, index) => {
        // Subtle layout asymmetry: every 7th item if featured can span 2 columns on wide screens
        const shouldSpan = allowFeaturedSpans && website.featured && (index % 5 === 0);
        return (
          <WebsiteCard
            key={website.id}
            website={website}
            featuredSpan={shouldSpan}
          />
        );
      })}
    </div>
  );
};
