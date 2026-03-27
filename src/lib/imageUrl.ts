const UPLOADS_BASE = (import.meta.env.VITE_UPLOADS_URL as string | undefined) ?? '/uploads';

const FALLBACK = '/images/logos/vibria_Avatar_petrol_1000px.png';

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return FALLBACK;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${UPLOADS_BASE}/${path}`;
}
