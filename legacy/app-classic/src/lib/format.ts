export function formatTaxonomyValue(value?: string | null): string {
  if (!value) return 'Not set';
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

