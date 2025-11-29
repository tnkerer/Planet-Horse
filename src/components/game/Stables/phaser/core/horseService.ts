// src/components/game/Stables/phaser/core/horseService.ts
import { Horse } from '../../types/horse';

type BackendHorse = {
  tokenId: string;
  nickname?: string | null;
  name: string;
  sex: string;               // "male"/"female"
  rarity: string;            // e.g. "common"
  foodUsed: number;
  status: 'IDLE' | 'RACING' | 'RESTING' | string;
  lastBreeding: string | null;
  currentBreeds: number;
  maxBreeds: number;
  level: number;
  exp: number;
  upgradable: boolean;
  currentPower: number;
  currentSprint: number;
  currentSpeed: number;
  currentEnergy: number;
  maxEnergy: number;
  legacy: boolean;
  gen: number;
  stableid: string | null;
  equipments: any[];
  horseCareerFactor: number;
  ownerCareerFactor: number;
  mmr: number;
};

type NextEnergyRes = { nextTimestamp: number };

export type HorseSnapshot = {
  horses: Horse[];
  nextRecoveryTs: number | null;
  loading: boolean;
  error?: string;
};

type Listener = (snap: HorseSnapshot) => void;

export type HorseStoreOpts = {
  apiBase: string;                 // e.g. process.env.API_URL
  credentials?: RequestCredentials; // 'include' recommended
  pollBaseMs?: number;             // default 22000
  jitterRatio?: number;            // 0..1, default 0.3
  maxBackoffMs?: number;           // default 120000
};

export class HorseLiveStore {
  private snap: HorseSnapshot = { horses: [], nextRecoveryTs: null, loading: false };
  private readonly listeners = new Set<Listener>();

  private readonly apiBase: string;
  private readonly credentials: RequestCredentials;
  private readonly pollBase: number;
  private readonly jitter: number;
  private readonly maxBackoff: number;

  private timer: number | null = null;
  private backoff = 0;
  private hidden = false;
  private destroyed = false;

  private inFlight: AbortController | null = null;
  private pendingRefresh = false;

  // Conditional request cache (ETags)
  private etagHorses: string | null = null;
  private etagRecovery: string | null = null;

  constructor(opts: HorseStoreOpts) {
    this.apiBase = opts.apiBase.replace(/\/+$/, '');
    this.credentials = opts.credentials ?? 'include';
    this.pollBase = opts.pollBaseMs ?? 22000;
    this.jitter = opts.jitterRatio ?? 0.30;
    this.maxBackoff = opts.maxBackoffMs ?? 120000;

    // Visibility control
    const onVis = () => {
      this.hidden = document.hidden;
      if (this.hidden) this.stopTimer();
      else this.scheduleSoon(0); // wake with immediate check
    };
    document.addEventListener('visibilitychange', onVis);
    // store cleanup of this handler:
    (this as any)._offVis = () => document.removeEventListener('visibilitychange', onVis);
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    // push immediate snapshot
    fn(this.snap);
    return () => this.listeners.delete(fn);
  }

  getSnapshot() { return this.snap; }

  start() {
    if (this.destroyed) return;
    this.scheduleSoon(0); // fetch immediately
  }

  destroy() {
    this.destroyed = true;
    this.stopTimer();
    this.inFlight?.abort();
    (this as any)._offVis?.();
    this.listeners.clear();
  }

  /** Ask for a refresh soon (debounced if one is in flight) */
  refreshSoon(delayMs = 250) {
    if (this.destroyed) return;
    // If a fetch is in flight, mark pending and let it run to completion
    if (this.inFlight) { this.pendingRefresh = true; return; }
    this.scheduleSoon(delayMs);
  }

  private scheduleSoon(delayMs: number) {
    if (this.destroyed || this.hidden) return;
    this.stopTimer();
    this.timer = window.setTimeout(() => { void this.tick(); }, delayMs) as unknown as number;
  }

  private stopTimer() {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private notify() {
    for (const l of this.listeners) {
      try { l(this.snap); } catch { }
    }
  }

  private setLoading(loading: boolean) {
    if (this.snap.loading !== loading) {
      this.snap = { ...this.snap, loading };
      this.notify();
    }
  }

  private setData(next: Partial<HorseSnapshot>) {
    this.snap = { ...this.snap, ...next };
    this.notify();
  }

  private nextPollDelay() {
    // base ± jitter
    const j = this.pollBase * this.jitter;
    const base = this.pollBase + (Math.random() * 2 * j - j);
    // apply backoff if any
    return Math.min(base + this.backoff, this.maxBackoff);
  }

  private async tick() {
    if (this.destroyed || this.hidden) return;
    // De-dupe / cancel
    this.inFlight?.abort();
    const ac = new AbortController();
    this.inFlight = ac;

    this.setLoading(true);
    let ok = false;
    try {
      const [horses, recovery] = await Promise.all([
        this.fetchHorses(ac.signal),
        this.fetchRecovery(ac.signal),
      ]);

      // If both 304, keep snapshot; else update
      if (horses.changed || recovery.changed) {
        const mapped = horses.horses
          ? horses.horses.map(mapBackendHorseToGame)
          : this.snap.horses;
        const nextTs = recovery.nextRecoveryTs ?? this.snap.nextRecoveryTs;
        this.setData({ horses: mapped, nextRecoveryTs: nextTs, error: undefined });
      }
      ok = true;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        this.setData({ error: e?.message ?? 'Failed to load horses' });
      }
    } finally {
      this.setLoading(false);
      this.inFlight = null;

      // Pending quick refresh requested during in-flight?
      if (!this.destroyed && !this.hidden && this.pendingRefresh) {
        this.pendingRefresh = false;
        this.scheduleSoon(150); // very soon
        // return;
      }

      // backoff handling
      if (ok) this.backoff = 0;
      else this.backoff = Math.min(this.maxBackoff, (this.backoff || 1000) * 2);

      this.scheduleSoon(this.nextPollDelay());
    }
  }

  private async fetchHorses(signal: AbortSignal): Promise<{ changed: boolean; horses?: BackendHorse[] }> {
    const url = `${this.apiBase}/horses/blockchain`;
    const headers: Record<string, string> = {};
    if (this.etagHorses) headers['If-None-Match'] = this.etagHorses;

    const res = await fetch(url, { method: 'GET', credentials: this.credentials, signal, headers });
    if (res.status === 304) return { changed: false };
    if (!res.ok) throw new Error(`Horses ${res.status}`);

    const et = res.headers.get('ETag');
    if (et) this.etagHorses = et;

    const data = (await res.json()) as BackendHorse[];
    return { changed: true, horses: data };
  }

  private async fetchRecovery(signal: AbortSignal): Promise<{ changed: boolean; nextRecoveryTs?: number | null }> {
    const url = `${this.apiBase}/horses/next-energy-recovery`;
    const headers: Record<string, string> = {};
    if (this.etagRecovery) headers['If-None-Match'] = this.etagRecovery;

    const res = await fetch(url, { method: 'GET', credentials: this.credentials, signal, headers });
    if (res.status === 304) return { changed: false };
    if (!res.ok) throw new Error(`Recovery ${res.status}`);

    const et = res.headers.get('ETag');
    if (et) this.etagRecovery = et;

    const { nextTimestamp } = (await res.json()) as NextEnergyRes;
    return { changed: true, nextRecoveryTs: nextTimestamp ?? null };
  }
}

// --- mapping identical to your hook's shape ---
function mapBackendHorseToGame(h: BackendHorse): Horse {
  return {
    id: Number(h.tokenId),
    profile: {
      nickname: h.nickname ?? null,
      name: h.name,
      name_slug: h.name.toLowerCase().replace(/\s+/g, '-'),
      sex: h.sex.toLowerCase(),
      type_horse: h.rarity.toUpperCase(),
      type_horse_slug: h.rarity.toLowerCase(),
      type_jockey: 'NONE',
      time: '120 Days',
      food_used: h.foodUsed,
    },
    staty: {
      status: h.status,
      started: h.lastBreeding,
      breeding: `${h.currentBreeds}/${h.maxBreeds}`,
      level: String(h.level),
      exp: String(h.exp),
      upgradable: h.upgradable,
      power: String(h.currentPower),
      sprint: String(h.currentSprint),
      speed: String(h.currentSpeed),
      energy: `${h.currentEnergy}/${h.maxEnergy}`,
      generation: String(h.gen),
      stable: String(h.stableid),
      horseCareerFactor: h.horseCareerFactor,
      ownerCareerFactor: h.ownerCareerFactor,
      legacy: h.legacy,
      mmr: h.mmr
    },
    items: h.equipments,
  };
}
