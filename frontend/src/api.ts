export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1', ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === 'string' ? body.detail : response.status === 422 ? 'Revisa los campos: hay datos inválidos o demasiado largos.' : response.status === 429 ? 'Demasiados intentos. Espera un minuto.' : 'No se pudo completar la solicitud.';
    throw new Error(detail);
  }
  return response.status === 204 ? undefined as T : response.json();
}
