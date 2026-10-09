import { WebsiteDefinition } from '../../src/types/website-definition';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWebsiteDefinition(definition: WebsiteDefinition): ValidationResult {
  const errors: string[] = [];

  if (!definition) {
    return { valid: false, errors: ['Website definition is missing or null.'] };
  }

  if (!definition.name || !definition.name.trim()) {
    errors.push('Website name is required.');
  }

  if (!definition.theme) {
    errors.push('Theme definition is missing.');
  } else {
    if (!definition.theme.accentColor) {
      errors.push('Theme accent color is required.');
    }
  }

  if (!Array.isArray(definition.sections) || definition.sections.length === 0) {
    errors.push('Website must contain at least one page section.');
  } else {
    if (definition.sections.length < 2) {
      errors.push('A valid production website requires at least two sections (e.g. Navigation and Hero).');
    }

    definition.sections.forEach((sec, idx) => {
      if (!sec.id) errors.push(`Section at position ${idx} is missing a unique ID.`);
      if (!sec.type) errors.push(`Section at position ${idx} is missing a valid type.`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeWebsiteDefinition(definition: WebsiteDefinition): WebsiteDefinition {
  // Deep clone to ensure immutability
  const sanitized: WebsiteDefinition = JSON.parse(JSON.stringify(definition));

  // Strip any internal or private metadata
  if (sanitized.meta) {
    delete (sanitized.meta as any).internalNotes;
    delete (sanitized.meta as any).userSession;
  }

  return sanitized;
}
