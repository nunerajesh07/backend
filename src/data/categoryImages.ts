/**
 * Stable image URLs for seeded articles (category hints only; not bundled assets).
 */
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80';

const BY_CATEGORY: Record<string, string> = {
  Announcements:
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
  'Campus Life':
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
  Events:
    'https://images.unsplash.com/photo-1540575467063-027a676d6d66?auto=format&fit=crop&w=1200&q=80',
  Placements:
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
  Tech: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
};

export function getCategoryImageUrl(category: string): string {
  return BY_CATEGORY[category] ?? DEFAULT_IMAGE;
}
