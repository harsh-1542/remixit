import React from 'react';
import { CATEGORIES } from '../data/categories';
import { useRouter } from '../lib/router';
import { ArrowUpRight } from 'lucide-react';

export const CategoryGrid: React.FC = () => {
  const { navigate } = useRouter();

  // Selected 8 main categories for the homepage section as requested
  const homepageCategories = [
    'AI',
    'SaaS',
    'Finance',
    'Agency',
    'E-commerce',
    'Real Estate',
    'Portfolio',
    'Architecture',
  ];

  const categories = CATEGORIES.filter((c) =>
    homepageCategories.includes(c.id)
  );

  const handleSelectCategory = (categoryId: string) => {
    navigate(`/explore?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <section id="categories" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-zinc-200/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
        <div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
            Taxonomy &amp; Archetypes
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 font-sans">
            Explore by category.
          </h2>
        </div>
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>View all archetypes</span>
          <ArrowUpRight className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Visually Distinct Editorial Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat, index) => (
          <div
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id)}
            className="group cursor-pointer p-5 rounded-xl border border-zinc-200/80 bg-white/60 hover:bg-white hover:border-zinc-400/80 hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all flex flex-col justify-between min-h-[170px]"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>0{index + 1}</span>
                <span className="group-hover:text-zinc-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                  ↗
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 tracking-tight group-hover:text-zinc-900">
                {cat.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="text-zinc-600">{cat.count} references</span>
              <span className="text-zinc-400 group-hover:text-zinc-900 transition-colors">Filter library</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
