/**
 * Theory Page templates — 4 sector categories (same as Report Stage 2).
 * User picks a sector, fills GI, then Project Profile section selector.
 */

export const THEORY_CATEGORIES = [
  {
    id: 'THEORY_MANUFACTURING',
    category: 'manufacturing',
    title: 'Manufacturing',
    description: 'AI theory pages for manufacturing units — full Project Profile and Analysis.',
    sectorLabel: 'Manufacturing',
  },
  {
    id: 'THEORY_TRADING',
    category: 'trading',
    title: 'Trading',
    description: 'AI theory pages for trading businesses — full Project Profile and Analysis.',
    sectorLabel: 'Trading',
  },
  {
    id: 'THEORY_SERVICE_WITH_STOCK',
    category: 'service_with_stock',
    title: 'Service with Stock',
    description: 'AI theory pages for service units that maintain stock.',
    sectorLabel: 'Service with Stock',
  },
  {
    id: 'THEORY_SERVICE_WITHOUT_STOCK',
    category: 'service_without_stock',
    title: 'Service without Stock',
    description: 'AI theory pages for service units without inventory stock.',
    sectorLabel: 'Service without Stock',
  },
];

/** Default Theory page price (INR) when TemplateConfig has no entry. */
export const THEORY_DEFAULT_PRICE = 100;

export function isTheoryTemplateId(templateId) {
  return typeof templateId === 'string' && templateId.toUpperCase().startsWith('THEORY_');
}

export function getTheoryPageTemplates() {
  return THEORY_CATEGORIES.map((t) => ({ ...t }));
}

export function getTheoryPageTemplateById(templateId) {
  if (!templateId) return null;
  return THEORY_CATEGORIES.find((t) => t.id === templateId) || null;
}

export function categoryFromTheoryTemplateId(templateId) {
  return getTheoryPageTemplateById(templateId)?.category || null;
}
