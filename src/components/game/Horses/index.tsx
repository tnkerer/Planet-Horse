import React, { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.scss';
import ItemBag from '../Modals/ItemBag';
import SingleHorse from '../SingleHorse';
import Image from 'next/image';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import wronIcon from '@/assets/icons/wron.gif';
import medalIcon from '@/assets/icons/medal.gif';
import { useUser } from '@/contexts/UserContext';
import InfoModal from '../Modals/InfoModal';
import RacesModal from '../Modals/RacesModal';
import MineModal from '../Modals/MineModal';
import { useHorseList, OrderByType } from '../Stables/hooks/useHorseList';

const ORDER_OPTIONS = [
  { value: 'level', label: 'Highest Level' },
  { value: 'rarity', label: 'Highest Rarity' },
  { value: 'energy', label: 'Most Energy' },
];

interface Props {
  changeView: (view: string) => void;
}

const Horses: React.FC<Props> = ({ changeView }) => {
  const [modalRaces, setModalRaces] = useState(false);
  const [modalMine, setModalMine] = useState(false)
  const [modalItems, setModalItems] = useState(false);
  const { phorse, medals, wron } = useUser();

  const [timeLeft, setTimeLeft] = useState<string>('—:—:—');
  const [orderBy, setOrderBy] = useState<OrderByType>('level');
  const [informational, setInformational] = useState<string | null>(null);
  const { horseList, loadHorses, nextRecoveryTs } = useHorseList(orderBy);

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