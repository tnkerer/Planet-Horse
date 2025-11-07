// src/components/game/BreedFarm/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './styles.module.scss';
import ItemBag from '../Modals/ItemBag';
import Image from 'next/image';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import wronIcon from '@/assets/icons/wron.gif';
import medalIcon from '@/assets/icons/medal.gif';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';
import InfoModal from '../Modals/InfoModal';
import BreedingStud from '../BreedingStud';
import MineModal from '../Modals/MineModal';
import BreedingModal from '../Modals/BreedingModal';
import { BreedingProvider, useBreeding } from '@/contexts/BreedingContext';

type OrderByType = 'level' | 'rarity' | 'energy';

interface BackendHorse {
  tokenId: string;
  name: string;
  sex: 'MALE' | 'FEMALE';
  status: string;
  rarity: string;
  exp: number;
  upgradable: boolean;
  level: number;
  currentPower: number;
  currentSprint: number;
  currentSpeed: number;
  currentEnergy: number;
  maxEnergy: number;
  lastRace: string | null;
  createdAt: string;
  updatedAt: string;
  nickname: string | null;
  foodUsed: number;
  legacy: boolean;
  gen: number;
  lastBreeding: string;
  currentBreeds: number;
  maxBreeds: number;
  stableid: string | null;
  equipments: Array<{
    id: string;
    ownerId: string;
    horseId: string;
    name: string;
    value: number;
    breakable: boolean;
    uses: number;
    createdAt: string;
    updatedAt: string;
  }>;
  horseCareerFactor: number;
  ownerCareerFactor: number;
}

export interface Horse {
  id: number;
  profile: {
    nickname: string | null;
    name: string;
    name_slug: string;
    sex: string;
    type_horse: string;
    type_horse_slug: string;
    type_jockey: string;
    time: string;
    food_used: number;
  };
  staty: {
    status: string;
    started: string;
    breeding: string;
    level: string;
    exp: string;
    upgradable: boolean;
    power: string;
    sprint: string;
    speed: string;
    energy: string;
    generation: string;
    stable: string | null;
    horseCareerFactor: number;
    ownerCareerFactor: number;
    legacy: boolean;
  };
  items: Array<{
    id: string;
    ownerId: string;
    horseId: string;
    name: string;
    value: number;
    breakable: boolean;
    uses: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface Props {
  changeView: (view: string) => void;
}

const BreedFarmInner: React.FC<Props> = ({ changeView }) => {
  const [modalItems, setModalItems] = useState(false);
  const { phorse, medals, wron, shards, updateBalance } = useUser();
  const { address } = useWallet();

  const [rawHorseList, setRawHorseList] = useState<Horse[]>([]);
  const [horseList, setHorseList] = useState<Horse[]>([]);
  const [orderBy, setOrderBy] = useState<OrderByType>('level');
  const [informational, setInformational] = useState<string | null>(null);
  const [modalMine, setModalMine] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);
  const currencyRef = useRef<HTMLDivElement | null>(null);

  type CurrencyKey = 'PHORSE' | 'MEDALS' | 'WRON' | 'SHARDS';
  const SHARD_ICON_SRC = '/assets/icons/shard.gif';

  // Tiny cookie helpers (no deps)
  const setCookie = (name: string, value: string, days = 180) => {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
  };
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Which currency to show on the button
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyKey>('PHORSE');

  // Hydrate from cookie on mount
  useEffect(() => {
    const saved = getCookie('selectedCurrency') as CurrencyKey | null;
    if (saved === 'PHORSE' || saved === 'MEDALS' || saved === 'WRON' || saved === 'SHARDS') {
      setSelectedCurrency(saved);
    }
  }, []);

  const formatNum = (n: number | undefined | null, decimals = 0) =>
    (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

  const selectedIconAndValue = () => {
    switch (selectedCurrency) {
      case 'PHORSE':
        return { src: phorseToken, w: 22, h: 22, alt: 'phorse', text: formatNum(phorse, 0), id: 'phorse-balance' };
      case 'MEDALS':
        return { src: medalIcon, w: 14, h: 20, alt: 'medal', text: formatNum(medals, 0), id: 'medals-balance' };
      case 'WRON':
        return { src: wronIcon, w: 22, h: 22, alt: 'wron', text: formatNum(wron, 2), id: 'wron-balance' };
      case 'SHARDS':
        // shards icon uses public path; Next/Image handles it fine
        return { src: SHARD_ICON_SRC as any, w: 10, h: 20, alt: 'shards', text: formatNum(shards, 0), id: 'shards-balance' };
    }
  };


  const loadHorses = useCallback(async () => {
    if (!address) {
      setRawHorseList([]);
      return;
    }
    updateBalance();

    try {
      const [hRes] = await Promise.all([
        fetch(`${process.env.API_URL}/horses/blockchain`, { credentials: 'include' }),
        // fetch(`${process.env.API_URL}/horses/next-energy-recovery`, { credentials: 'include' }),
      ]);

      if (!hRes.ok) throw new Error(`Horses ${hRes.status}`);

      const data = (await hRes.json()) as BackendHorse[];

      const mapped: Horse[] = data.map(h => ({
        id: Number(h.tokenId),
        profile: {
          nickname: h.nickname ? h.nickname : null,
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
          breeding: `${String(h.currentBreeds)}/${String(h.maxBreeds)}`,
          level: String(h.level),
          exp: String(h.exp),
          upgradable: h.upgradable,
          power: String(h.currentPower),
          sprint: String(h.currentSprint),
          speed: String(h.currentSpeed),
          energy: `${h.currentEnergy}/${h.maxEnergy}`,
          generation: String(h.gen),
          stable: h.stableid,
          horseCareerFactor: h.horseCareerFactor,
          ownerCareerFactor: h.ownerCareerFactor,
          legacy: h.legacy
        },
        items: h.equipments,
      }));

      setRawHorseList(mapped);
    } catch (err) {
      console.error('Failed to load horses:', err);
      setRawHorseList([]);
    }
  }, [address, updateBalance]);

  useEffect(() => { loadHorses(); }, [loadHorses]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!currencyRef.current) return;
      if (!currencyRef.current.contains(e.target as Node)) {
        setShowCurrencies(false);
      }
    }
    if (showCurrencies) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [showCurrencies]);

  useEffect(() => {
    setHorseList(sortHorses(rawHorseList, orderBy));
  }, [rawHorseList, orderBy]);

  const toggleItemBag = () => setModalItems(prev => !prev);

  function sortHorses(list: Horse[], order: OrderByType): Horse[] {
    const arr = [...list];
    const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    switch (order) {
      case 'level':
        arr.sort((a, b) => parseInt(b.staty.level) - parseInt(a.staty.level));
        break;
      case 'energy': {
        const val = (s: string) => parseInt(s.split('/')[0], 10);
        arr.sort((a, b) => val(b.staty.energy) - val(a.staty.energy));
        break;
      }
      case 'rarity': {
        arr.sort((a, b) => {
          const aIdx = rarityOrder.indexOf(a.profile.type_horse_slug);
          const bIdx = rarityOrder.indexOf(b.profile.type_horse_slug);
          return aIdx - bIdx;
        });
        break;
      }
    }
    return arr;
  }

  const sel = selectedIconAndValue();

  return (
    <>
      <ItemBag status={modalItems} closeModal={toggleItemBag} />
      {modalMine && <MineModal setVisible={setModalMine} status={modalMine} />}

      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionContainer}>
              <div className={styles.actionOptions}>
                <button
                  className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                  onClick={() => setModalItems(true)}
                  aria-label="Open Bag"
                >
                  <span className={styles.notificationBadge}></span>
                </button>
                <button
                  className={styles.racingButton}
                  onClick={() => changeView('horses')}
                  aria-label="Go to racing"
                >
                  <span className={styles.notificationBadge}></span>
                </button>
                <button
                  className={styles.upgradeButton}
                  onClick={() => { setModalMine(true); }}
                />

                
              </div>
            </div>
          </div>

          <div className={styles.countCurrency} ref={currencyRef}>


            <button
              className={styles.currencyButton}
              onClick={() => setShowCurrencies((s) => !s)}
              aria-label="Open balances"
            >
              {/* Icon */}
              <Image src={sel.src} width={sel.w} height={sel.h} alt={sel.alt} />
              {/* Value */}
              <span id={sel.id}>{sel.text}</span>
              <i className={showCurrencies ? styles.chevUp : styles.chevDown} aria-hidden />
            </button>

            {showCurrencies && (
              <div className={styles.currencyDropdown}>
                <div
                  className={styles.currencyRow}
                  onClick={() => {
                    setSelectedCurrency('PHORSE');
                    setCookie('selectedCurrency', 'PHORSE');
                    setShowCurrencies(false);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Image src={phorseToken} width={22} height={22} alt="phorse" />
                  <span id='phorse-balance'>{formatNum(phorse, 0)}</span>
                </div>

                <div
                  className={styles.currencyRow}
                  onClick={() => {
                    setSelectedCurrency('MEDALS');
                    setCookie('selectedCurrency', 'MEDALS');
                    setShowCurrencies(false);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Image src={medalIcon} width={14} height={20} alt="medal" />
                  <span id='medals-balance'>{formatNum(medals, 0)}</span>
                </div>

                <div
                  className={styles.currencyRow}
                  onClick={() => {
                    setSelectedCurrency('WRON');
                    setCookie('selectedCurrency', 'WRON');
                    setShowCurrencies(false);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Image src={wronIcon} width={22} height={22} alt="wron" />
                  <span id='wron-balance'>{formatNum(wron, 2)}</span>
                </div>

                <div
                  className={styles.currencyRow}
                  onClick={() => {
                    setSelectedCurrency('SHARDS');
                    setCookie('selectedCurrency', 'SHARDS');
                    setShowCurrencies(false);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Image src={SHARD_ICON_SRC} width={10} height={20} alt="shards" />
                  <span id='shards-balance'>{formatNum(shards, 0)}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className={styles.container}>
        <StudsRow horses={horseList} />
      </div>

      {informational && (
        <InfoModal text={informational} onClose={() => setInformational(null)} />
      )}
    </>
  );
};

const StudsRow: React.FC<{ horses: Horse[] }> = ({ horses }) => {
  const { studs } = useBreeding();
  const [studModalOpen, setStudModalOpen] = useState(false);
  const [activeStudId, setActiveStudId] = useState<number | null>(null);

  // Count only horses that are housed in a stable
  const housedCount = React.useMemo(
    () => horses.filter((h) => h.staty.stable != null).length,
    [horses]
  );

  // Desired studs = ceil(housed / 2), but show at least 1
  const desiredStuds = Math.max(1, Math.ceil(housedCount / 2));

  const { resizeStudSlots } = useBreeding();
  useEffect(() => {
    resizeStudSlots(desiredStuds);
  }, [desiredStuds, resizeStudSlots]);

  // Render up to what the provider currently supports to avoid undefined access
  const renderStuds = Math.min(desiredStuds, Array.isArray(studs) ? studs.length : desiredStuds);

  const openStud = (slot: number) => {
    if (studs?.[slot]?.active) {
      console.log(`Stud ${slot} is being used (active breeding).`);
      return;
    }
    setActiveStudId(slot);
    setStudModalOpen(true);
  };

  return (
    <>
      <div className={styles.studsRow}>
        {Array.from({ length: renderStuds }).map((_, i) => (
          <BreedingStud
            key={i}
            index={i}
            id={i}
            horses={horses}
            onOpen={() => openStud(i)}
          />
        ))}
      </div>

      <BreedingModal
        status={studModalOpen}
        studId={activeStudId}
        horses={horses}
        onClose={() => setStudModalOpen(false)}
      />
    </>
  );
};

const BreedFarm: React.FC<Props> = (props) => {
  return (
    <BreedingProvider>
      <BreedFarmInner {...props} />
    </BreedingProvider>
  );
};

export default BreedFarm;
