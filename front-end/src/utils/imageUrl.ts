export const getImageUrl = (path: string | undefined | null): string => {
  // 1. Check if path is empty/invalid
  if (!path || (typeof path === 'string' && path.trim() === '')) {
    return '/placeholder-phone.png';
  }
  
  // 2. If it's already a full URL, return it
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  
  // 3. Otherwise, prepend the API base URL
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
};
