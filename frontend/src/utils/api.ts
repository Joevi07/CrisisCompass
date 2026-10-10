/** API origin for production deployments; leave unset for the Vite local proxy. */
const configuredApiOrigin = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '';

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiOrigin}${normalizedPath}`;
}
