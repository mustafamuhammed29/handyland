export const getImageUrl = (path: string): string => {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${path}`;
};
