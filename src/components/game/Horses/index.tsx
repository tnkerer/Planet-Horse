import React, { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.scss';
import ItemBag from '../Modals/ItemBag';
import SingleHorse from '../SingleHorse';
import Image from 'next/image';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import wronIcon from '@/assets/icons/wron.gif';
import medalIcon from '@/assets/icons/medal.gif';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';
import InfoModal from '../Modals/InfoModal';
import RacesModal from '../Modals/RacesModal';
import MineModal from '../Modals/MineModal';

type OrderByType = 'level' | 'rarity' | 'energy';
const ORDER_OPTIONS = [
  { value: 'level', label: 'Highest Level' },
  { value: 'rarity', label: 'Highest Rarity' },
  { value: 'energy', label: 'Most Energy' },
];

// Backend response shape
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
  gen: number;
  lastBreeding: string;
  currentBreeds: number;
  maxBreeds: number;
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

const Horses: React.FC<Props> = ({ changeView }) => {
  const [modalRaces, setModalRaces] = useState(false);
  const [modalMine, setModalMine] = useState(false)
  const [modalItems, setModalItems] = useState(false);
  const { phorse, medals, wron, updateBalance } = useUser();
  const { isAuthorized, address } = useWallet();

  const [rawHorseList, setRawHorseList] = useState<Horse[]>([]);
  const [horseList, setHorseList] = useState<Horse[]>([]);
  const [nextRecoveryTs, setNextRecoveryTs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('—:—:—');

  const [orderBy, setOrderBy] = useState<OrderByType>('level');

  const [informational, setInformational] = useState<string | null>(null);

  const loadHorses = useCallback(async () => {
    if (!address) {
      setRawHorseList([]);
      setNextRecoveryTs(null);
      return;
    }
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
          nickname: h.nickname ? h.nickname : null,
          name: h.name,
          name_slug: h.name.toLowerCase().replace(/\s+/g, '-'),
          sex: h.sex.toLowerCase(),
          type_horse: h.rarity.toUpperCase(),
          type_horse_slug: h.rarity.toLowerCase(),
          type_jockey: 'NONE',
          time: '120 Days',
          food_used: h.foodUsed
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
          generation: String(h.gen)
        },
        items: h.equipments,
      }));

      setRawHorseList(mapped);
      setNextRecoveryTs(nextTimestamp);
    } catch (err) {
      console.error('Failed to load horses:', err);
      setRawHorseList([]);
      setNextRecoveryTs(null);
    }
  }, [address, updateBalance]);

  useEffect(() => {
    loadHorses();
  }, [loadHorses]);

  useEffect(() => {
    setHorseList(sortHorses(rawHorseList, orderBy));
  }, [rawHorseList, orderBy]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderBy(e.target.value as OrderByType);
  };

  const toggleItemBag = () => setModalItems(prev => !prev);

  useEffect(() => {
    if (nextRecoveryTs == null) return;
    const tick = () => {
      const diff = nextRecoveryTs - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return clearInterval(id);
      }
      const h = Math.floor(diff / 3600_000);
      const m = Math.floor((diff % 3600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0')
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRecoveryTs]);

  function sortHorses(list: Horse[], orderBy: OrderByType): Horse[] {
    const arr = [...list];
    const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

    switch (orderBy) {
      case 'level':
        arr.sort((a, b) => parseInt(b.staty.level) - parseInt(a.staty.level));
        break;
      case 'energy':
        arr.sort((a, b) => {
          const aE = parseInt(a.staty.energy.split('/')[0], 10);
          const bE = parseInt(b.staty.energy.split('/')[0], 10);
          return bE - aE;
        });
        break;
      case 'rarity':
        arr.sort((a, b) => {
          const aIdx = rarityOrder.indexOf(a.profile.type_horse_slug);
          const bIdx = rarityOrder.indexOf(b.profile.type_horse_slug);
          return aIdx - bIdx;
        });
        break;
    }

    return arr;
  }

  return (
    <>

      {modalRaces && (
        <RacesModal
          setVisible={setModalRaces}
          status={modalRaces}
          totalHorses={horseList.filter(h => h.staty.status === 'IDLE').length}
          horses={horseList.filter(h => h.staty.status === 'IDLE')}
          reloadHorses={loadHorses}
        />
      )}

      {modalMine && (
        <MineModal
          setVisible={setModalMine}
          status={modalMine}
        />
      )}

      <ItemBag status={modalItems} closeModal={toggleItemBag} />

      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                onClick={toggleItemBag}
              />
              <button
                className={styles.refreshButton}
                onClick={async () => {
                  await loadHorses();
                  setInformational('Stable reloaded!');
                }}
              />
              <button
                className={styles.raceAllButton}
                onClick={() => { setModalRaces(true); }}
              />
              <button
                className={styles.upgradeButton}
                onClick={() => { setModalMine(true); }}
              />
            </div>
          </div>
          <div className={styles.countCurrency}>
            <div className={styles.currencyGroup}>
              <Image src={phorseToken} width={25} height={25} alt="phorse" />
              <span id='phorse-balance'>{phorse?.toFixed(0) || 0}</span>
            </div>
            <div className={styles.currencyGroup}>
              <Image src={medalIcon} width={14} height={20} alt="medal" />
              <span id='medals-balance'>{medals?.toFixed(0) || 0}</span>
            </div>
            <div className={styles.currencyGroup}>
              <Image src={wronIcon} width={25} height={25} alt="wron" />
              <span id='wron-balance'>{wron?.toFixed(2) || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.countRow}>
          {nextRecoveryTs && (
            <span className={styles.nextRecovery}>
              <span className={styles.fullLabel}>Next Energy recovery in ‎ </span>
              <span className={styles.shortLabel}>⚡ ‎ </span>
              {timeLeft}
            </span>
          )}
          <span className={styles.countHorses}>
            {horseList.length} Horses
          </span>
          <div className={styles.orderBy}>
            <label htmlFor="orderBySelect">Order By:{" "}</label>
            <select
              id="orderBySelect"
              value={orderBy}
              onChange={handleOrderChange}
            >
              {ORDER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.cardHorses}>
          {horseList.map((h) => (
            <SingleHorse
              key={h.id}
              horse={h}
              reloadHorses={loadHorses}
            />
          ))}

          <div className={styles.addHorse}>
            <div className={styles.addHorseWrapper}>
              <div className={styles.plusHorse} onClick={() => { window.open("https://marketplace.roninchain.com/collections/origin-horses", "_blank") }}>+</div>
              <div className={styles.addHorseText}>
                <a
                  href="https://marketplace.roninchain.com/collections/origin-horses"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.addHorseLink}
                >
                  GRAB SOME HORSES AND YOU WILL BE ON YOUR WAY TO RUNNING LIKE A PRO!
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {informational && (
        <InfoModal
          text={informational}
          onClose={() => setInformational(null)}
        />
      )}
    </>
  );
};

export default Horses;
