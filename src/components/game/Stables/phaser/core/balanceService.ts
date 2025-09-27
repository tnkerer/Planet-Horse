import Phaser from 'phaser';

export type BalanceSnapshot = {
    nickname: string | null;
    phorse: number | null;
    wron: number | null;
    medals: number | null;
    loading: boolean;
    error?: string;
};

type Listener = (snap: BalanceSnapshot) => void;

export type BalanceStoreOpts = {
    apiBase: string;
    credentials?: RequestCredentials; // 'include' recommended
    pollBaseMs?: number;              // base poll interval
    jitterRatio?: number;             // 0..1 fraction of jitter around base
    maxBackoffMs?: number;            // cap for error backoff
};

export class BalanceLiveStore {
    private snap: BalanceSnapshot = {
        nickname: null, phorse: null, wron: null, medals: null, loading: false,
    };

    private readonly listeners = new Set<Listener>();
    private destroyed = false;
    private hidden = false;

    private readonly apiBase: string;
    private readonly credentials: RequestCredentials;
    private readonly pollBase: number;
    private readonly jitter: number;
    private readonly maxBackoff: number;

    private timer: number | null = null;
    private backoff = 0;
    private inFlight: AbortController | null = null;
    private pendingRefresh = false;

    // Conditional request tag
    private etag: string | null = null;

    constructor(opts: BalanceStoreOpts) {
        this.apiBase = opts.apiBase.replace(/\/+$/, '');
        this.credentials = opts.credentials ?? 'include';
        this.pollBase = opts.pollBaseMs ?? 20000; // 20s base
        this.jitter = opts.jitterRatio ?? 0.30;
        this.maxBackoff = opts.maxBackoffMs ?? 120000;

        const onVis = () => {
            this.hidden = document.hidden;
            if (this.hidden) this.stopTimer();
            else this.scheduleSoon(0);
        };
        document.addEventListener('visibilitychange', onVis);
        (this as any)._offVis = () => document.removeEventListener('visibilitychange', onVis);
    }

    subscribe(fn: Listener) {
        this.listeners.add(fn);
        fn(this.snap);
        return () => this.listeners.delete(fn);
    }

    start() {
        if (this.destroyed) return;
        this.scheduleSoon(0);
    }

    destroy() {
        this.destroyed = true;
        this.stopTimer();
        this.inFlight?.abort();
        (this as any)._offVis?.();
        this.listeners.clear();
    }

    /** Gentle nudge to refresh shortly (debounced if a fetch is running). */
    refreshSoon(delayMs = 250) {
        if (this.destroyed) return;
        if (this.inFlight) { this.pendingRefresh = true; return; }
        this.scheduleSoon(delayMs);
    }

    // ---- internals
    private notify() { for (const l of this.listeners) { try { l(this.snap); } catch { } } }
    private setLoading(loading: boolean) {
        if (this.snap.loading !== loading) { this.snap = { ...this.snap, loading }; this.notify(); }
    }

    private setData(p: Partial<BalanceSnapshot>) {
        this.snap = { ...this.snap, ...p }; this.notify();
    }

    private stopTimer() { if (this.timer != null) { clearTimeout(this.timer); this.timer = null; } }
    private nextDelay() {
        const j = this.pollBase * this.jitter;
        const base = this.pollBase + (Math.random() * 2 * j - j);
        return Math.min(base + this.backoff, this.maxBackoff);
    }

    private scheduleSoon(delayMs: number) {
        if (this.destroyed || this.hidden) return;
        this.stopTimer();
        this.timer = window.setTimeout(() => { void this.tick(); }, delayMs) as unknown as number;
    }

    private async tick() {
        const runnable = !this.destroyed && !this.hidden;

        this.inFlight?.abort();
        const ac = new AbortController();
        this.inFlight = ac;

        if (!runnable) {
            this.inFlight = null;
            this.setLoading(false);
            return;
        }

        this.setLoading(true);

        let ok = false;
        let shouldReschedule = false;

        try {
            const result = await this.fetchBalance(ac.signal);
            if (result.changed) {
                const { nickname, phorse, wron, medals } = result.data;
                this.setData({
                    nickname: nickname ?? null,
                    phorse: typeof phorse === 'number' ? phorse : null,
                    wron: typeof wron === 'number' ? wron : null,
                    medals: typeof medals === 'number' ? medals : null,
                    error: undefined,
                });
            }
            ok = true;
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                this.setData({ error: e?.message ?? 'Failed to fetch balance' });
            }
        } finally {
            this.setLoading(false);
            this.inFlight = null;

            if (!this.destroyed && !this.hidden && this.pendingRefresh) {
                this.pendingRefresh = false;
                shouldReschedule = true;
            }
        }

        // Schedule only if still valid
        if (!this.destroyed && !this.hidden) {
            if (shouldReschedule) {
                this.backoff = 0;
                this.scheduleSoon(150);
            } else {
                this.backoff = ok ? 0 : Math.min(this.maxBackoff, (this.backoff || 1000) * 2);
                this.scheduleSoon(this.nextDelay());
            }
        }
    }


    private async fetchBalance(signal: AbortSignal): Promise<{
        changed: boolean; data?: {
            nickname: string; phorse: number; wron: number; medals: number;
        }
    }> {
        const url = `${this.apiBase}/user/balance`;
        const headers: Record<string, string> = {};
        if (this.etag) headers['If-None-Match'] = this.etag;

        const res = await fetch(url, { method: 'GET', credentials: this.credentials, signal, headers });
        if (res.status === 304) return { changed: false };
        if (!res.ok) throw new Error(`Balance ${res.status}`);

        const et = res.headers.get('ETag');
        if (et) this.etag = et;

        const data = await res.json();
        return { changed: true, data };
    }
}
