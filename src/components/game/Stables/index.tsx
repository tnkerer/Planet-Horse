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
import BalanceSwitcher, { BalanceItem } from '@/components/common/BalanceSwitcher';


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
          <div className={styles.currencyContainer}>
            <BalanceSwitcher
              cookieKey="balances:primary"
              initialKey="PHORSE"
              balances={[
                { key: 'PHORSE', icon: phorseToken, iconW: 22, iconH: 22, alt: 'phorse', value: phorse, decimals: 0, id: 'phorse-balance' },
                { key: 'MEDALS', icon: medalIcon, iconW: 14, iconH: 20, alt: 'medal', value: medals, decimals: 0, id: 'medals-balance' },
                { key: 'WRON', icon: wronIcon, iconW: 22, iconH: 22, alt: 'wron', value: wron, decimals: 2, id: 'wron-balance' },
                { key: 'SHARDS', icon: '/assets/icons/shard.gif', iconW: 10, iconH: 20, alt: 'shards', value: shards, decimals: 0, id: 'shards-balance' },
              ] as BalanceItem[]}
              classes={{
                container: styles.countCurrency,
                button: styles.currencyButton,
                dropdown: styles.currencyDropdown,
                row: styles.currencyRow,
                chevUp: styles.chevUp,
                chevDown: styles.chevDown,
              }}
            />

            <BalanceSwitcher
              cookieKey="balances:secondary"
              initialKey="SHARDS"
              balances={[
                { key: 'PHORSE', icon: phorseToken, iconW: 22, iconH: 22, alt: 'phorse', value: phorse, decimals: 0, id: 'phorse-balance-2' },
                { key: 'MEDALS', icon: medalIcon, iconW: 14, iconH: 20, alt: 'medal', value: medals, decimals: 0, id: 'medals-balance-2' },
                { key: 'WRON', icon: wronIcon, iconW: 22, iconH: 22, alt: 'wron', value: wron, decimals: 2, id: 'wron-balance-2' },
                { key: 'SHARDS', icon: '/assets/icons/shard.gif', iconW: 10, iconH: 20, alt: 'shards', value: shards, decimals: 0, id: 'shards-balance-2' },
              ] as BalanceItem[]}
              classes={{
                container: styles.countCurrency,   // reuse same styling or create a variant
                button: styles.currencyButton,
                dropdown: styles.currencyDropdown,
                row: styles.currencyRow,
                chevUp: styles.chevUp,
                chevDown: styles.chevDown,
              }}
            />
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
