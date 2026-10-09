import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
}) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 transition-all focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 shadow-xs">
        <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2.5" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search websites, styles, industries..."
          aria-label="Search websites"
          className="w-full text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 bg-transparent border-0 focus:outline-none"
        />
        {value && (
          <button
            onClick={onClear}
            type="button"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
