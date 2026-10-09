import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../lib/router';
import { WEBSITES } from '../data/websites';
import { FilterState } from '../types';
import { filterWebsites } from '../lib/filtering';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { WebsiteGrid } from '../components/WebsiteGrid';
import { SearchX, RotateCcw } from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const { searchParams } = useRouter();

  // Initial filter state from URL query or defaults
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [filters, setFilters] = useState<FilterState>({
    search: initialSearch,
    category: initialCategory,
    style: 'All',
    feature: 'All',
    technology: 'All',
    sortBy: 'featured',
  });

  // Sync if query param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFilters((prev) => ({ ...prev, category: cat }));
    }
  }, [searchParams]);

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      style: 'All',
      feature: 'All',
      technology: 'All',
      sortBy: 'featured',
    });
  };

  const filteredWebsites = useMemo(
    () => filterWebsites(WEBSITES, filters),
    [filters]
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="max-w-3xl mb-8 sm:mb-10">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
          Design Archive
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 font-sans">
          Explore websites.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
          Find ideas by industry, style, features, and technology.
        </p>
      </div>

      {/* Large Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={filters.search}
          onChange={(val) => handleFilterChange({ search: val })}
          onClear={() => handleFilterChange({ search: '' })}
        />
      </div>

      {/* Filter Bar Controls */}
      <div className="mb-8">
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={filteredWebsites.length}
        />
      </div>

      {/* Grid or Polished Empty State */}
      {filteredWebsites.length > 0 ? (
        <WebsiteGrid websites={filteredWebsites} allowFeaturedSpans={false} />
      ) : (
        <div className="py-20 px-4 text-center rounded-2xl border border-dashed border-zinc-300 bg-white/40 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
            No websites found
          </h3>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
            Try changing your search or filters to discover matching references.
          </p>
          <div className="mt-6">
            <button
              onClick={handleResetFilters}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
