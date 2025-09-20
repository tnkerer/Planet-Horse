// src/components/game/Stables/index.tsx
import React, { useState } from 'react';
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
import { bus } from './phaser/bus';
import type { Horse } from './types/horse';

interface Props {
  changeView: (view: string) => void;
}

const Stables: React.FC<Props> = ({ changeView }) => {
  const [modalItems, setModalItems] = useState(false);
  const [modalMine, setModalMine] = useState(false);
  const [informational, setInformational] = useState<string | null>(null);
  const { horseList, loadHorses } = useHorseList('level');
  const { phorse, medals, wron, updateBalance } = useUser();
  const { address } = useWallet();

  // balance refresh on mount if needed
  React.useEffect(() => {
    if (address) updateBalance();
  }, [address, updateBalance]);

  return (
    <>
      <ItemBag status={modalItems} closeModal={() => setModalItems(false)} />
      {modalMine && <MineModal setVisible={setModalMine} status={modalMine} />}


      {/* <div className={styles.secondBar}>
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
            </div>
          </div>

          <div className={styles.countCurrency}>
            <div className={styles.currencyGroup}>
              <Image src={phorseToken} width={25} height={25} alt="phorse" />
              <span id="phorse-balance">{phorse?.toFixed(0) || 0}</span>
            </div>
            <div className={styles.currencyGroup}>
              <Image src={medalIcon} width={14} height={20} alt="medal" />
              <span id="medals-balance">{medals?.toFixed(0) || 0}</span>
            </div>
            <div className={styles.currencyGroup}>
              <Image src={wronIcon} width={25} height={25} alt="wron" />
              <span id="wron-balance">{wron?.toFixed(2) || 0}</span>
            </div>
          </div>
        </div>
      </div> */}

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
