import React from 'react';
import { WebsiteDefinition } from '../../types/website-definition';
import { SectionDispatcher } from './SectionDispatcher';

interface WebsiteCanvasProps {
  website: WebsiteDefinition;
  viewport: 'desktop' | 'tablet' | 'mobile';
  selectedSectionId?: string;
  onSelectSection?: (id: string) => void;
}

export const WebsiteCanvas: React.FC<WebsiteCanvasProps> = ({
  website,
  viewport,
  selectedSectionId,
  onSelectSection,
}) => {
  const viewportStyles = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto shadow-2xl rounded-2xl border border-zinc-300 overflow-hidden my-4',
    mobile: 'max-w-[390px] mx-auto shadow-2xl rounded-3xl border border-zinc-300 overflow-hidden my-4',
  }[viewport];

  return (
    <div className="w-full h-full overflow-y-auto bg-zinc-200/50 p-2 sm:p-6 transition-all select-none">
      <div
        className={`transition-all duration-300 min-h-full ${viewportStyles}`}
        style={{
          backgroundColor: website.theme.backgroundColor,
          color: website.theme.textColor,
          fontFamily: website.theme.fontBody || 'sans-serif',
        }}
      >
        {website.sections.map((section) => (
          <div
            key={section.id}
            onClick={() => onSelectSection?.(section.id)}
            className="cursor-pointer"
          >
            <SectionDispatcher
              section={section}
              theme={website.theme}
              isSelected={selectedSectionId === section.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
