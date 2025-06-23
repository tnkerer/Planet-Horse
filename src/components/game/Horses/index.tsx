import React, { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.scss';
import ItemBag from '../Modals/ItemBag';
import SingleHorse from '../SingleHorse';
import Image from 'next/image';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import medalIcon from '@/assets/icons/medal.gif';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';
import ConfirmModal from '../Modals/ConfirmModal';
import ErrorModal from '../Modals/ErrorModal';
import { BrowserProvider, Contract } from 'ethers';

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

// Contract Info
const CONTRACT_ADDRESS = '0xC15878E61fc284ff83cf0dBA532226387A7E083e';
const CONTRACT_ABI = [
  'function safeMint(address to, string uri) public returns (uint256)'
];
const MINT_URI = 'https://gateway.pinata.cloud/ipfs/bafkreifbrfgg7imhbwziffvw43mavfnu2ndapnpauldxrbaqntkdsp67qa';

const Horses: React.FC<Props> = ({ changeView }) => {
  const [modalItems, setModalItems] = useState(false);
  const { phorse, medals, updateBalance } = useUser();
  const { isAuthorized, address } = useWallet();

  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [rawHorseList, setRawHorseList] = useState<Horse[]>([]);
  const [horseList, setHorseList] = useState<Horse[]>([]);
  const [nextRecoveryTs, setNextRecoveryTs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('—:—:—');

  const [orderBy, setOrderBy] = useState<OrderByType>('level');

  // Provider helpers
  const getRoninProvider = () => {
    const ronin = (window as any).ronin;
    if (!ronin?.provider) {
      throw new Error('Ronin wallet not detected.');
    }
    return new BrowserProvider(ronin.provider);
  };

  const ensureCorrectNetwork = async () => {
    const provider = (window as any).ronin.provider;
    const chainId = await provider.request({ method: 'eth_chainId' });
    const saigonChainId = '0x7e5'; // 2021 in hex

    if (chainId !== saigonChainId) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: saigonChainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: saigonChainId,
                chainName: 'Saigon Testnet',
                rpcUrls: ['https://saigon-testnet.roninchain.com/rpc'],
                nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
                blockExplorerUrls: ['https://saigon-explorer.roninchain.com/'],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  };

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
          name: h.name,
          name_slug: h.name.toLowerCase().replace(/\s+/g, '-'),
          sex: h.sex.toLowerCase(),
          type_horse: h.rarity.toUpperCase(),
          type_horse_slug: h.rarity.toLowerCase(),
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

  // 🔥 MINT Handler
  const handleDoClaim = async () => {
    setShowClaimConfirm(false);
    setClaimError(null);
    setClaiming(true);

    try {
      if (!address) throw new Error('Wallet not connected');

      await ensureCorrectNetwork();

      const provider = getRoninProvider();
      const signer = await provider.getSigner();

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.safeMint(address, MINT_URI);
      console.log('Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      await loadHorses();
    } catch (err: any) {
      console.error(err);
      setClaimError(
        'Transaction failed, maybe you have already claimed a horse in the last 2 hours?'
      );
    } finally {
      setClaiming(false);
    }
  };

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
                  setClaimError('Stable reloaded!');
                }}
              />
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
              <div className={styles.plusHorse} onClick={e => {
                e.preventDefault();
                if (!claiming) setShowClaimConfirm(true);
              }}>+</div>
              <div className={styles.addHorseText}>
                <a
                  href="#"
                  className={styles.addHorseLink}
                  onClick={e => {
                    e.preventDefault();
                    if (!claiming) setShowClaimConfirm(true);
                  }}
                >
                  GRAB SOME HORSES AND YOU WILL BE ON YOUR WAY TO RUNNING LIKE A PRO!
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showClaimConfirm && (
        <ConfirmModal
          text={`Mint a new horse! You are limited to 1 mint each 2 hours otherwise this operation will fail.`}
          onClose={() => setShowClaimConfirm(false)}
          onConfirm={handleDoClaim}
        />
      )}

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
