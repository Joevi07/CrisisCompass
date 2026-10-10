/** API origin for production deployments; leave unset for the Vite local proxy. */
const configuredApiOrigin = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '';

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiOrigin}${normalizedPath}`;
}

/** Read API responses defensively so proxy errors and empty bodies are actionable. */
export async function readApiJson<T>(response: Response, action: string): Promise<T> {
  const body = await response.text();
  let payload: unknown;

  if (body) {
    try {
      payload = JSON.parse(body);
    } catch {
      if (response.ok) {
        throw new Error(`${action}: the server returned an invalid response.`);
      }
    }
  }

  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : '';
    throw new Error(detail || `${action} failed (HTTP ${response.status}).`);
  }

  if (payload === undefined) throw new Error(`${action}: the server returned an empty response.`);
  return payload as T;
}
