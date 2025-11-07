import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackendHorse, Horse } from '../types/horse';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';

export type OrderByType = 'level' | 'rarity' | 'energy';

export function useHorseList(orderBy: OrderByType = 'level') {
  const { updateBalance } = useUser();
  const { address } = useWallet();

  const [rawHorseList, setRawHorseList] = useState<Horse[]>([]);
  const [horseList, setHorseList] = useState<Horse[]>([]);
  const [nextRecoveryTs, setNextRecoveryTs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHorses = useCallback(async () => {
    if (!address) {
      setRawHorseList([]); setNextRecoveryTs(null);
      return;
    }
    setLoading(true);
    updateBalance();

    try {
      const [hRes, rRes] = await Promise.all([
        fetch(`${process.env.API_URL}/horses/blockchain`, { credentials: 'include' }),
        fetch(`${process.env.API_URL}/horses/next-energy-recovery`, { credentials: 'include' }),
      ]);
      if (!hRes.ok) throw new Error(`Horses ${hRes.status}`);
      if (!rRes.ok) throw new Error(`Recovery ${rRes.status}`);

      const data = (await hRes.json()) as BackendHorse[];
      const { nextTimestamp } = (await rRes.json()) as { nextTimestamp: number };

      const mapped: Horse[] = data.map(h => ({
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
          legacy: h.legacy
        },
        items: h.equipments,
      }));

      setRawHorseList(mapped);
      setNextRecoveryTs(nextTimestamp);
    } catch (err) {
      console.error('Failed to load horses:', err);
      setRawHorseList([]); setNextRecoveryTs(null);
    } finally {
      setLoading(false);
    }
  }, [address, updateBalance]);

  useEffect(() => { loadHorses(); }, [loadHorses]);

  useEffect(() => {
    const list = sortHorses(rawHorseList, orderBy);
    setHorseList(list);
  }, [rawHorseList, orderBy]);

  const rarityOrder = useMemo(() => ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'], []);
  function sortHorses(list: Horse[], ob: OrderByType): Horse[] {
    const arr = [...list];
    switch (ob) {
      case 'level':  arr.sort((a, b) => +b.staty.level - +a.staty.level); break;
      case 'energy': arr.sort((a, b) => parseInt(b.staty.energy) - parseInt(a.staty.energy)); break;
      case 'rarity':
        arr.sort((a, b) =>
          rarityOrder.indexOf(a.profile.type_horse_slug) - rarityOrder.indexOf(b.profile.type_horse_slug)
        );
        break;
    }
    return arr;
  }

  return { horseList, rawHorseList, loadHorses, nextRecoveryTs, loading };
}
