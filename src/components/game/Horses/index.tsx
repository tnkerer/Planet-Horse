import React, { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.scss';
import ItemBag from '../Modals/ItemBag';
import SingleHorse from '../SingleHorse';
import Image from 'next/image';
import Link from 'next/link';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import medalIcon from '@/assets/icons/medal.gif';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';
import ConfirmModal from '../Modals/ConfirmModal';
import ErrorModal from '../Modals/ErrorModal';

// Backend response shape for each horse
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
  // "equipments" is now an array of full Item objects
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

// Front-end’s Horse interface (imported by SingleHorse)
export interface Horse {
  id: number;
  profile: {
    name: string;
    name_slug: string;
    sex: string;
    type_horse: string;
    type_horse_slug: string;
    type_jockey: string;
    time: string;
  };
  staty: {
    status: string;
    level: string;
    exp: string;
    upgradable: boolean;
    power: string;
    sprint: string;
    speed: string;
    energy: string;
  };
  // Now: an array of full Item objects
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
  const [modalItems, setModalItems] = useState(false);
  const { phorse, medals, updateBalance } = useUser();
  const { isAuthorized, address } = useWallet();

  // ─── Claim‐horse states ──────────────────────────────────────────────────────
  const [showClaimConfirm, setShowClaimConfirm] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const [horseList, setHorseList] = useState<Horse[]>([]);
  const [nextRecoveryTs, setNextRecoveryTs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('—:—:—');

  // Fetch and map horses from backend
  const loadHorses = useCallback(async () => {
    if (!address) {
      setHorseList([]);
      setNextRecoveryTs(null);
      return;
    }
    updateBalance();

    try {
      const [horsesRes, recoveryRes] = await Promise.all([
        fetch(`${process.env.API_URL}/horses`, { credentials: 'include' }),
        fetch(`${process.env.API_URL}/horses/next-energy-recovery`, { credentials: 'include' }),
      ]);
      if (!horsesRes.ok) throw new Error(`Horses HTTP ${horsesRes.status}`);
      if (!recoveryRes.ok) throw new Error(`Recovery HTTP ${recoveryRes.status}`);

      const data = (await horsesRes.json()) as BackendHorse[];
      const recJson = await recoveryRes.json() as { nextTimestamp: number };

      const mapped: Horse[] = data.map((h) => {
        const idNum = Number(h.tokenId);
        const raritySlug = h.rarity.toLowerCase();

        return {
          id: idNum,
          profile: {
            name: h.name,
            name_slug: h.name.toLowerCase().replace(/\s+/g, '-'),
            sex: h.sex.toLowerCase(),
            type_horse: h.rarity.toUpperCase(),
            type_horse_slug: raritySlug,
            type_jockey: 'NONE',
            time: '120 Days',
          },
          staty: {
            status: h.status,
            level: String(h.level),
            exp: String(h.exp),
            upgradable: h.upgradable,
            power: String(h.currentPower),
            sprint: String(h.currentSprint),
            speed: String(h.currentSpeed),
            energy: `${h.currentEnergy}/${h.maxEnergy}`,
          },
          // Pass the full Item objects through to the front-end
          items: h.equipments.length > 0
            ? h.equipments.map(e => ({
              id: e.id,
              ownerId: e.ownerId,
              horseId: e.horseId,
              name: e.name,
              value: e.value,
              breakable: e.breakable,
              uses: e.uses,
              createdAt: e.createdAt,
              updatedAt: e.updatedAt,
            }))
            : [],
        };
      });

      setHorseList(mapped);
      setNextRecoveryTs(recJson.nextTimestamp);
    } catch (err) {
      console.error('Failed to load horses:', err);
      setHorseList([]);
      setNextRecoveryTs(null);
    }
  }, [address, updateBalance]);

  useEffect(() => {
    loadHorses();
  }, [loadHorses]);

  const toggleItemBag = () => setModalItems((prev) => !prev);

  // ─── countdown timer ────────────────────────────────────────────────────────
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

  // ─── Handler when user clicks “Yes” on ClaimConfirm ─────────────────────────
  const handleDoClaim = async () => {
    setShowClaimConfirm(false)
    setClaimError(null)
    setClaiming(true)
    try {
      const res = await fetch(`${process.env.API_URL}/horses/claim-horse`, {
        method: 'PUT',
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const errJson = await res.json()
          if (errJson?.message) msg = errJson.message
        } catch {
          // ignore JSON parse
        }
        throw new Error(msg)
      }
      // success → reload list
      await loadHorses()
    } catch (e: any) {
      console.error(e)
      setClaimError(e.message || 'Failed to claim a horse')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <>
      {/* Item‐Bag Modal */}
      <ItemBag
        status={modalItems}
        closeModal={toggleItemBag}
      />

      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                onClick={toggleItemBag}
                aria-label="Open Bag"
              >
                <span className={styles.notificationBadge}></span>
              </button>
              <button
                className={styles.refreshButton}
                onClick={async () => {
                  await loadHorses();
                  setClaimError('Stable reloaded!')
                }}
                aria-label="refresh"
              >
                <span className={styles.notificationBadge}></span>
              </button>
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src={phorseToken} alt="phorse coin" />
            <span>{phorse?.toFixed(0) || 0}</span>
            <Image width={29} height={40} src={medalIcon} alt="medals" />
            <span>{medals?.toFixed(0) || 0}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.countRow}>
          <span className={styles.nextRecovery}>
            <span className={styles.fullLabel}>Next Energy recovery in ‎  </span>
            <span className={styles.shortLabel}>⚡ ‎  </span>
            {timeLeft}
          </span>
          <span className={styles.countHorses}>
            {horseList.length} Horses
          </span>
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
              <div className={styles.plusHorse} onClick={e => {
                e.preventDefault()
                setShowClaimConfirm(true)
              }}>+</div>
              <div className={styles.addHorseText}>
                {/* Prevent default navigation; open ConfirmModal instead */}
                <a
                  href="#"
                  className={styles.addHorseLink}
                  onClick={e => {
                    e.preventDefault()
                    setShowClaimConfirm(true)
                  }}
                >
                  GRAB SOME HORSES AND YOU WILL BE ON YOUR WAY TO RUNNING LIKE A PRO!
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ─────────────── Confirm “Claim a horse?” ───────────────────────────── */}
      {showClaimConfirm && (
        <ConfirmModal
          text={`Claim a new horse for 1000 PHORSE?`}
          onClose={() => setShowClaimConfirm(false)}
          onConfirm={handleDoClaim}
        />
      )}

      {/* ─────────────── Error if claim failed ──────────────────────────────── */}
      {claimError && (
        <ErrorModal
          text={claimError}
          onClose={() => setClaimError(null)}
        />
      )}
    </>
  );
};

export default Horses;