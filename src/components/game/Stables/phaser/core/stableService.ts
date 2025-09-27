export type BackendStable = {
  tokenId: string; // "1".."400"
  level: number;   // 1..4
};

export type StableSnapshot = {
  stable: BackendStable | null;
  loading: boolean;
  error?: string;
};

type Listener = (snap: StableSnapshot) => void;

export class StableLiveStore {
  private snap: StableSnapshot = { stable: null, loading: false };
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly apiBase: string,
    private readonly credentials: RequestCredentials = 'include'
  ) {}

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.snap);
    return () => this.listeners.delete(fn);
  }

  destroy() { this.listeners.clear(); }

  private notify() { for (const l of this.listeners) l(this.snap); }

  private set(partial: Partial<StableSnapshot>) {
    this.snap = { ...this.snap, ...partial };
    this.notify();
  }

  async fetchOnce(signal?: AbortSignal) {
    this.set({ loading: true, error: undefined });
    try {
      const res = await fetch(`${this.apiBase.replace(/\/+$/,'')}/stable/blockchain`, {
        method: 'GET',
        credentials: this.credentials,
        signal,
      });
      if (!res.ok) throw new Error(`Stable ${res.status}`);
      const arr = (await res.json()) as BackendStable[];
      const first = Array.isArray(arr) && arr.length > 0 ? arr[0] : null; // backend returns lowest tokenId only
      this.set({ stable: first, loading: false });
    } catch (e:any) {
      if (e?.name === 'AbortError') return;
      this.set({ error: e?.message ?? 'Failed to load stable', loading: false });
    }
  }
}
