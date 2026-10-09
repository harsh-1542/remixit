import React, { useState } from 'react';
import { NavbarSection, WebsiteTheme } from '../../types/website-definition';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export const NavbarRenderer: React.FC<{
  section: NavbarSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = theme.mode === 'dark';

  return (
    <header
      className={`w-full border-b transition-colors select-none ${
        section.isSticky ? 'sticky top-0 z-30' : ''
      }`}
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span
            className="text-lg font-bold tracking-tight font-sans flex items-center gap-2"
            style={{ color: theme.textColor }}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: theme.accentColor }}
            />
            {section.brandName}
          </span>
          {section.tagline && (
            <span
              className="hidden md:inline-block text-xs font-mono border-l pl-3"
              style={{ color: theme.mutedTextColor, borderColor: theme.borderColor }}
            >
              {section.tagline}
            </span>
          )}
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-6">
          {section.links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              onClick={(e) => e.preventDefault()}
              className="text-xs font-medium tracking-tight transition-opacity hover:opacity-75"
              style={{ color: theme.mutedTextColor }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {section.secondaryCta && (
            <a
              href={section.secondaryCta.href}
              onClick={(e) => e.preventDefault()}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              style={{ color: theme.textColor }}
            >
              {section.secondaryCta.label}
            </a>
          )}
          {section.primaryCta && (
            <a
              href={section.primaryCta.href}
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-transform active:scale-95 shadow-xs"
              style={{
                backgroundColor: theme.primaryColor,
                color: isDark ? '#FFFFFF' : '#FFFFFF',
              }}
            >
              <span>{section.primaryCta.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </a>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          {section.primaryCta && (
            <a
              href={section.primaryCta.href}
              onClick={(e) => e.preventDefault()}
              className="text-xs font-semibold px-3 py-1.5 rounded-md"
              style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
            >
              {section.primaryCta.label}
            </a>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-md text-zinc-500"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-3"
          style={{ backgroundColor: theme.cardBackground, borderColor: theme.borderColor }}
        >
          {section.links.map((link, i) => (
            <div key={i}>
              <a
                href={link.href}
                onClick={(e) => e.preventDefault()}
                className="block text-sm font-medium py-1"
                style={{ color: theme.textColor }}
              >
                {link.label}
              </a>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
