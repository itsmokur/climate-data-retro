/**
 * Generates a stable per-tab client ID stored in sessionStorage.
 * Each browser tab gets a unique ID — used for voting and presence.
 */
export function getClientId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'retro_client_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}
