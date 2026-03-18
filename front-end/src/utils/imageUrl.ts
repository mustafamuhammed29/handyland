export const getImageUrl = (path: string | undefined | null): string => {
  // حالة 1: لا يوجد مسار — أرجع placeholder
  if (!path || path.trim() === '') {
    return '/placeholder-device.svg';
  }
  
  // حالة 2: رابط كامل http/https — أرجعه مباشرة
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // حالة 3: مسار نسبي يبدأ بـ / — أضف base URL
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
