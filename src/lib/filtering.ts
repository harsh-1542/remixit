import { Website, FilterState } from '../types';

export function filterWebsites(
  websites: Website[],
  filters: FilterState
): Website[] {
  return websites
    .filter((site) => {
      // 1. Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = site.name.toLowerCase().includes(query);
        const matchesDesc = site.description.toLowerCase().includes(query);
        const matchesCategory = site.category.toLowerCase().includes(query);
        const matchesStyle = site.style.toLowerCase().includes(query);
        const matchesTags = site.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        const matchesTech = site.technologies.some((tech) =>
          tech.toLowerCase().includes(query)
        );
        const matchesFeature = site.features.some((feat) =>
          feat.toLowerCase().includes(query)
        );

        if (
          !matchesName &&
          !matchesDesc &&
          !matchesCategory &&
          !matchesStyle &&
          !matchesTags &&
          !matchesTech &&
          !matchesFeature
        ) {
          return false;
        }
      }

      // 2. Category filter
      if (filters.category !== 'All' && site.category !== filters.category) {
        return false;
      }

      // 3. Style filter
      if (filters.style !== 'All' && site.style !== filters.style) {
        return false;
      }

      // 4. Feature filter
      if (
        filters.feature !== 'All' &&
        !site.features.includes(filters.feature)
      ) {
        return false;
      }

      // 5. Technology filter
      if (
        filters.technology !== 'All' &&
        !site.technologies.includes(filters.technology)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'popular') {
        return b.popularity - a.popularity;
      }
      if (filters.sortBy === 'newest') {
        const yearA = a.year || 2026;
        const yearB = b.year || 2026;
        if (yearB !== yearA) return yearB - yearA;
        return b.popularity - a.popularity;
      }
      // 'featured'
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      return b.popularity - a.popularity;
    });
}
