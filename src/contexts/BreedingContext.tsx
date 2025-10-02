import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

type SlotId = number; // ⬅️ dynamic, no longer 0|1 only
type GeneId = 17000 | 17001 | 17002;
type Costs = { phorseCost: number; ronCost: number };

type StudSlot = {
  id: SlotId;
  horseIds: number[];                 // chosen in UI
  geneIds?: [GeneId | null, GeneId | null];
  eligible?: boolean;
  costs?: Costs;
  reasons?: string[];
  active?: {                           // active server-side breeding (locks the slot)
    id: string;
    parents: number[];
    startedAtMs: number;
  };
};

type BreedingCtx = {
  studs: StudSlot[];                   // ⬅️ dynamic
  selectedHorseIds: number[];         // all picked + active parents (for filtering in modal)
  loadActiveBreeds: () => Promise<void>;
  resizeStudSlots: (count: number) => void;                 // ⬅️ new
  selectHorse: (slot: SlotId, horseId: number) => Promise<void>;
  clearSlot: (slot: SlotId) => void;
  preflight: (slot: SlotId) => Promise<void>;
  setGene: (slot: SlotId, geneSlot: 0 | 1, geneId: GeneId | null) => void;
  clearGenes: (slot: SlotId) => void;
};

const BreedingContext = createContext<BreedingCtx | null>(null);

const makeStud = (id: number): StudSlot => ({
  id,
  horseIds: [],
  geneIds: [null, null],
});

export const BreedingProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  // default to 2; UI may call resizeStudSlots() to expand/shrink
  const [studs, setStuds] = useState<StudSlot[]>([makeStud(0), makeStud(1)]);

  const selectedHorseIds = useMemo(() => {
    const set = new Set<number>();
    studs.forEach((s) => {
      s.horseIds.forEach((id) => set.add(id));
      s.active?.parents?.forEach((id) => set.add(id));
    });
    return Array.from(set);
  }, [studs]);

  // Allow UI to resize studs while preserving existing state
  const resizeStudSlots = useCallback((count: number) => {
    setStuds((prev) => {
      const activeSlots = prev.filter((s) => s.active).length;
      const safeCount = Math.max(count, activeSlots, 1);
      if (safeCount === prev.length) return prev;

      if (safeCount > prev.length) {
        const extra = Array.from({ length: safeCount - prev.length }, (_, i) =>
          makeStud(prev.length + i)
        );
        return [...prev, ...extra];
      }

      // Shrinking: keep all actives, move them to the front, then slice
      const actives = prev.filter((s) => s.active);
      const inactives = prev.filter((s) => !s.active);
      const reordered = [...actives, ...inactives].map((s, idx) => ({ ...s, id: idx }));
      return reordered.slice(0, safeCount);
    });
  }, []);

  const loadActiveBreeds = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.API_URL}/user/breed?finalizedOnly=true`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr: Array<{ id: string; parents: number[]; started: string; finalized: boolean }> =
        await res.json();

      setStuds((prev) => {
        // Ensure we have at least as many slots as active breeds
        const needed = Math.max(prev.length, arr.length, 1);
        let base = prev;
        if (needed > prev.length) {
          const extra = Array.from({ length: needed - prev.length }, (_, i) =>
            makeStud(prev.length + i)
          );
          base = [...prev, ...extra];
        }

        // Clear transient fields
        const next = base.map((s) => ({
          ...s,
          eligible: undefined,
          costs: undefined,
          reasons: undefined,
          active: undefined,
          geneIds: s.geneIds ?? [null, null],
        }));

        // Map ALL actives (no min cap)
        for (let i = 0; i < arr.length; i++) {
          const b = arr[i];
          next[i] = {
            ...next[i],
            horseIds: b.parents.map(Number),
            active: {
              id: b.id,
              parents: b.parents.map(Number),
              startedAtMs: Date.parse(b.started),
            },
            eligible: undefined,
            costs: undefined,
            reasons: undefined,
          };
        }
        return next;
      });
    } catch (e) {
      console.error('loadActiveBreeds failed', e);
    }
  }, []);

  const preflight = useCallback(
    async (slot: SlotId) => {
      const s = studs[slot];
      if (!s || s.horseIds.length !== 2) return;
      const [a, b] = s.horseIds;
      try {
        const res = await fetch(
          `${process.env.API_URL}/user/preflight?a=${a}&b=${b}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStuds((prev) => {
          const next = [...prev];
          if (!next[slot]) return prev;
          next[slot] = {
            ...next[slot],
            eligible: !!data.eligible,
            reasons: data.reasons || [],
            costs: data.costs,
          };
          return next;
        });
      } catch (e) {
        console.error('preflight failed', e);
        setStuds((prev) => {
          const next = [...prev];
          if (!next[slot]) return prev;
          next[slot] = {
            ...next[slot],
            eligible: false,
            reasons: ['Preflight failed'],
            costs: undefined,
          };
          return next;
        });
      }
    },
    [studs]
  );

  const selectHorse = useCallback(async (slot: SlotId, horseId: number) => {
    setStuds((prev) => {
      if (!prev[slot]) return prev;

      // reject duplicates across ANY slot or active parents
      const usedSomewhere = prev.some(
        (s) =>
          s.horseIds.includes(horseId) ||
          (s.active?.parents || []).includes(horseId)
      );
      if (usedSomewhere) return prev;

      const cur = prev[slot];
      if (cur.active || cur.horseIds.length >= 2) return prev;

      const newIds = [...cur.horseIds, horseId];
      const next = [...prev];
      next[slot] = {
        ...cur,
        horseIds: newIds,
        eligible: undefined,
        costs: undefined,
        reasons: undefined,
        geneIds: cur.geneIds ?? [null, null],
      };
      return next;
    });
    // preflight is triggered by the effect whenever length===2 & eligible===undefined
  }, []);

  const clearSlot = useCallback((slot: SlotId) => {
    setStuds((prev) => {
      if (!prev[slot]) return prev;
      const next = [...prev];
      next[slot] = {
        id: slot,
        horseIds: [],
        active: prev[slot].active, // keep active lock if server says so
        eligible: undefined,
        costs: undefined,
        reasons: undefined,
        geneIds: prev[slot].geneIds ?? [null, null],
      };
      return next;
    });
  }, []);

  const setGene = useCallback(
    (slot: SlotId, geneSlot: 0 | 1, geneId: GeneId | null) => {
      setStuds((prev) => {
        if (!prev[slot]) return prev;
        const cur = prev[slot];
        const curGenes: [GeneId | null, GeneId | null] = cur.geneIds ?? [null, null];

        if (geneId != null) {
          const otherSlot: 0 | 1 = geneSlot === 0 ? 1 : 0;
          if (curGenes[otherSlot] === geneId) {
            // no-op if trying to assign the same gene to both slots
            return prev;
          }
        }

        const nextGenes: [GeneId | null, GeneId | null] = [...curGenes] as any;
        nextGenes[geneSlot] = geneId;

        const next = [...prev];
        next[slot] = { ...cur, geneIds: nextGenes };
        return next;
      });
    },
    []
  );

  const clearGenes = useCallback((slot: SlotId) => {
    setStuds((prev) => {
      if (!prev[slot]) return prev;
      const next = [...prev];
      next[slot] = { ...prev[slot], geneIds: [null, null] };
      return next;
    });
  }, []);

  // Initial active breeds load
  useEffect(() => {
    void loadActiveBreeds();
  }, [loadActiveBreeds]);

  // Auto-preflight for ANY slot that becomes a full pair and wasn't checked yet
  useEffect(() => {
    studs.forEach((s, idx) => {
      if (!s.active && s.horseIds.length === 2 && s.eligible === undefined) {
        void preflight(idx);
      }
    });
  }, [studs, preflight]);

  return (
    <BreedingContext.Provider
      value={{
        studs,
        selectedHorseIds,
        loadActiveBreeds,
        resizeStudSlots, // ⬅️ expose
        selectHorse,
        clearSlot,
        preflight,
        setGene,
        clearGenes,
      }}
    >
      {children}
    </BreedingContext.Provider>
  );
};

export const useBreeding = () => {
  const ctx = useContext(BreedingContext);
  if (!ctx) throw new Error('useBreeding must be used within BreedingProvider');
  return ctx;
};
