import React from 'react';
import { FilterState } from '../types';
import { CATEGORIES, STYLES, FEATURES, TECHNOLOGIES } from '../data/categories';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const [expandedDropdowns, setExpandedDropdowns] = React.useState(false);

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.style !== 'All' ||
    filters.feature !== 'All' ||
    filters.technology !== 'All' ||
    filters.search !== '';

  const industryList = ['All', ...CATEGORIES.map((c) => c.id)];

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Primary Category Segmented Control (Horizontal Scroll on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none border-b border-zinc-200/60">
        <span className="text-xs font-mono text-zinc-400 mr-1 shrink-0 uppercase">
          Industry:
        </span>
        {industryList.map((cat) => {
          const isActive = filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange({ category: cat })}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-100/90 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/80'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Secondary Filter Controls Bar (Style, Feature, Tech, Sort & Result Count) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Dropdown filters cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Style select */}
          <div className="relative">
            <select
              value={filters.style}
              onChange={(e) => onChange({ style: e.target.value })}
              className="appearance-none bg-white border border-zinc-200 text-xs text-zinc-800 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs hover:border-zinc-300"
              aria-label="Filter by visual style"
            >
              {STYLES.map((st) => (
                <option key={st} value={st}>
                  Style: {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Feature select */}
          <div className="relative">
            <select
              value={filters.feature}
              onChange={(e) => onChange({ feature: e.target.value })}
              className="appearance-none bg-white border border-zinc-200 text-xs text-zinc-800 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs hover:border-zinc-300"
              aria-label="Filter by feature"
            >
              {FEATURES.map((feat) => (
                <option key={feat} value={feat}>
                  Feature: {feat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Technology select */}
          <div className="relative">
            <select
              value={filters.technology}
              onChange={(e) => onChange({ technology: e.target.value })}
              className="appearance-none bg-white border border-zinc-200 text-xs text-zinc-800 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs hover:border-zinc-300"
              aria-label="Filter by technology"
            >
              {TECHNOLOGIES.map((tech) => (
                <option key={tech} value={tech}>
                  Tech: {tech}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right side: Sort and Result Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-xs font-mono text-zinc-500">
            <span className="font-semibold text-zinc-900">{totalResults}</span>{' '}
            {totalResults === 1 ? 'website' : 'websites'}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">Sort:</span>
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  onChange({
                    sortBy: e.target.value as 'featured' | 'popular' | 'newest',
                  })
                }
                className="appearance-none bg-white border border-zinc-200 text-xs font-medium text-zinc-900 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs hover:border-zinc-300"
                aria-label="Sort websites"
              >
                <option value="featured">Featured</option>
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
