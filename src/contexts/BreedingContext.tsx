// src/contexts/BreedingContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type SlotId = 0 | 1;
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
  studs: [StudSlot, StudSlot];
  selectedHorseIds: number[];         // all picked + active parents (for filtering in modal)
  loadActiveBreeds: () => Promise<void>;
  selectHorse: (slot: SlotId, horseId: number) => Promise<void>;
  clearSlot: (slot: SlotId) => void;
  preflight: (slot: SlotId) => Promise<void>;
  setGene: (slot: SlotId, geneSlot: 0 | 1, geneId: GeneId | null) => void;
  clearGenes: (slot: SlotId) => void;
};

const BreedingContext = createContext<BreedingCtx | null>(null);

export const BreedingProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [studs, setStuds] = useState<[StudSlot, StudSlot]>([
    { id: 0, horseIds: [] },
    { id: 1, horseIds: [] },
  ]);

  const selectedHorseIds = useMemo(() => {
    const set = new Set<number>();
    studs.forEach(s => {
      s.horseIds.forEach(id => set.add(id));
      s.active?.parents?.forEach(id => set.add(id));
    });
    return Array.from(set);
  }, [studs]);

  const loadActiveBreeds = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.API_URL}/user/breed?finalizedOnly=true`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr: Array<{ id: string; parents: number[]; started: string; finalized: boolean }> = await res.json();

      const top2 = (arr || []).slice(0, 2);
      setStuds(prev => {
        const next: [StudSlot, StudSlot] = [
          { ...prev[0], eligible: undefined, costs: undefined, reasons: undefined, active: undefined, horseIds: prev[0].horseIds, geneIds: prev[0].geneIds ?? [null, null], },
          { ...prev[1], eligible: undefined, costs: undefined, reasons: undefined, active: undefined, horseIds: prev[1].horseIds, geneIds: prev[1].geneIds ?? [null, null], },
        ];
        top2.forEach((b, i) => {
          next[i] = {
            ...next[i],
            horseIds: b.parents.map(Number), // show both parents
            active: { id: b.id, parents: b.parents.map(Number), startedAtMs: Date.parse(b.started) },
            eligible: undefined,
            costs: undefined,
            reasons: undefined,
          };
        });
        return next;
      });
    } catch (e) {
      console.error('loadActiveBreeds failed', e);
    }
  }, []);

  const preflight = useCallback(async (slot: SlotId) => {
    const s = studs[slot];
    if (s.horseIds.length !== 2) return;
    const [a, b] = s.horseIds;
    try {
      const res = await fetch(`${process.env.API_URL}/user/preflight?a=${a}&b=${b}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStuds(prev => {
        const next = [...prev] as [StudSlot, StudSlot];
        next[slot] = { ...prev[slot], eligible: !!data.eligible, reasons: data.reasons || [], costs: data.costs };
        return next;
      });
    } catch (e) {
      console.error('preflight failed', e);
      setStuds(prev => {
        const next = [...prev] as [StudSlot, StudSlot];
        next[slot] = { ...prev[slot], eligible: false, reasons: ['Preflight failed'], costs: undefined };
        return next;
      });
    }
  }, [studs]);

  const selectHorse = useCallback(async (slot: SlotId, horseId: number) => {
    setStuds(prev => {
      const other = slot === 0 ? 1 : 0;
      const alreadyUsed =
        prev[slot].horseIds.includes(horseId) ||
        prev[other].horseIds.includes(horseId) ||
        prev[0].active?.parents?.includes(horseId) ||
        prev[1].active?.parents?.includes(horseId);

      if (alreadyUsed) return prev;
      const cur = prev[slot];
      if (cur.active || cur.horseIds.length >= 2) return prev;

      const newIds = [...cur.horseIds, horseId];

      const next = [...prev] as [StudSlot, StudSlot];
      next[slot] = { ...cur, horseIds: newIds, eligible: undefined, costs: undefined, reasons: undefined, geneIds: cur.geneIds ?? [null, null], };
      return next;
    });
    // No await here—preflight is triggered by the effect below when we *see* length===2
  }, []);

  const clearSlot = useCallback((slot: SlotId) => {
    setStuds(prev => {
      const next = [...prev] as [StudSlot, StudSlot];
      next[slot] = {
        id: slot,
        horseIds: [],
        // keep active if present, but do not clear genes here (we expose clearGenes separately)
        active: prev[slot].active,
        eligible: undefined,
        costs: undefined,
        reasons: undefined,
        geneIds: prev[slot].geneIds ?? [null, null],
      };
      return next;
    });
  }, []);

  const setGene = useCallback((slot: SlotId, geneSlot: 0 | 1, geneId: GeneId | null) => {
    setStuds(prev => {
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
      
      const next = [...prev] as [StudSlot, StudSlot];
      next[slot] = { ...cur, geneIds: nextGenes };
      return next;
    });
  }, []);

  // NEW: clear both gene slots
  const clearGenes = useCallback((slot: SlotId) => {
    setStuds(prev => {
      const cur = prev[slot];
      const next = [...prev] as [StudSlot, StudSlot];
      next[slot] = { ...cur, geneIds: [null, null] };
      return next;
    });
  }, []);

  useEffect(() => { loadActiveBreeds(); }, [loadActiveBreeds]);

  useEffect(() => {
    if (!studs[0].active && studs[0].horseIds.length === 2 && studs[0].eligible === undefined) preflight(0);
    if (!studs[1].active && studs[1].horseIds.length === 2 && studs[1].eligible === undefined) preflight(1);
  }, [studs, preflight]);

  return (
    <BreedingContext.Provider
      value={{
        studs,
        selectedHorseIds,
        loadActiveBreeds,
        selectHorse,
        clearSlot,
        preflight,
        setGene,       // ← NEW
        clearGenes,    // ← NEW
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
