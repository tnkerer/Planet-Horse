// utils/storage.ts
export const LS_KEYS = { musicOn: 'ph_music_on', volume: 'ph_music_volume' } as const;

export function getSavedBool(key: string, fallback = true) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v === '1';
  } catch { return fallback; }
}

export function getSavedNum(key: string, fallback = 0.6) {
  try {
    const v = localStorage.getItem(key); const n = Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  } catch { return fallback; }
}

export function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}
