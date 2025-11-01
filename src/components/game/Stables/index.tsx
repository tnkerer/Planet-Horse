// src/components/game/Stables/index.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import styles from './styles.module.scss';
import ItemBag from '../Modals/ItemBag';
import Image from 'next/image';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import wronIcon from '@/assets/icons/wron.gif';
import medalIcon from '@/assets/icons/medal.gif';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';
import MineModal from '../Modals/MineModal';
import InfoModal from '../Modals/InfoModal';
import PhaserStablesCanvas from './phaser/PhaserStablesCanvas';
import { useHorseList } from './hooks/useHorseList';
import QuestsHubModal from '../Modals/QuestsHubModal';

interface Props {
  changeView: (view: string) => void;
}

const Stables: React.FC<Props> = ({ changeView }) => {
  const [modalItems, setModalItems] = useState(false);
  const [modalMine, setModalMine] = useState(false);
  const [modalQuests, setModalQuests] = useState(false);
  const [informational, setInformational] = useState<string | null>(null);
  const { horseList, loadHorses } = useHorseList('level');
  const { phorse, medals, wron, shards, updateBalance } = useUser();
  const { address } = useWallet();

  type CurrencyKey = 'PHORSE' | 'MEDALS' | 'WRON' | 'SHARDS';
  const SHARD_ICON_SRC = '/assets/icons/shard.gif';

  // ADD inside BreedFarmInner component:
  const [showCurrencies, setShowCurrencies] = useState(false);
  const currencyRef = useRef<HTMLDivElement | null>(null);

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

  const sel = selectedIconAndValue();

  // Hydrate from cookie on mount
  useEffect(() => {
    const saved = getCookie('selectedCurrency') as CurrencyKey | null;
    if (saved === 'PHORSE' || saved === 'MEDALS' || saved === 'WRON' || saved === 'SHARDS') {
      setSelectedCurrency(saved);
    }
  }, []);


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

  // balance refresh on mount if needed
  React.useEffect(() => {
    if (address) updateBalance();
  }, [address, updateBalance]);

  return (
    <>
      <ItemBag status={modalItems} closeModal={() => setModalItems(false)} />
      {modalMine && <MineModal setVisible={setModalMine} status={modalMine} />}
      {modalQuests && (
        <QuestsHubModal setVisible={setModalQuests} status={modalQuests} />
      )}


      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
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
                onClick={() => setModalMine(true)}
                aria-label="Open Mine"
              />

              <button
                className={styles.questsButton}
                onClick={() => setModalQuests(true)}
                aria-label="Open Quests"
              />
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

      {/* === HERE: Phaser canvas instead of StudsRow === */}
      <div className={styles.container}>
        <div className={styles.canvasWrap}>
          <PhaserStablesCanvas horseList={horseList} reloadHorses={loadHorses} />
        </div>
      </div>

      {informational && (
        <InfoModal text={informational} onClose={() => setInformational(null)} />
      )}
    </>
  );
};

export default Stables;
