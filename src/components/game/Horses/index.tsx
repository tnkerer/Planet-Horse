import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import DerbyModal from '../Modals/DerbyModal';
import { useHorseList, OrderByType } from '../Stables/hooks/useHorseList';
import QuestsHubModal from '../Modals/QuestsHubModal';
import BalanceSwitcher, { BalanceItem } from '@/components/common/BalanceSwitcher';

const ORDER_OPTIONS = [
  { value: "level", label: "Highest Level" },
  { value: "rarity", label: "Highest Rarity" },
  { value: "energy", label: "Most Energy" },
];

interface Props {
  changeView: (view: string) => void;
}

const Horses: React.FC<Props> = ({ changeView }) => {
  const [modalRaces, setModalRaces] = useState(false);
  const [modalMine, setModalMine] = useState(false);
  const [modalDerby, setModalDerby] = useState(false);
  const [modalItems, setModalItems] = useState(false);
  const [modalQuests, setModalQuests] = useState(false);
  const { phorse, medals, wron, shards } = useUser();

  const [timeLeft, setTimeLeft] = useState<string>("—:—:—");
  const [orderBy, setOrderBy] = useState<OrderByType>("level");
  const [informational, setInformational] = useState<string | null>(null);
  const { horseList, loadHorses, nextRecoveryTs } = useHorseList(orderBy);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderBy(e.target.value as OrderByType);
  };

  const toggleItemBag = () => setModalItems((prev) => !prev);

  useEffect(() => {
    if (nextRecoveryTs == null) return;
    const tick = () => {
      const diff = nextRecoveryTs - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return clearInterval(id);
      }
      const h = Math.floor(diff / 3600_000);
      const m = Math.floor((diff % 3600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(
        String(h).padStart(2, "0") +
        ":" +
        String(m).padStart(2, "0") +
        ":" +
        String(s).padStart(2, "0")
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
          totalHorses={
            horseList.filter((h) => h.staty.status === "IDLE").length
          }
          horses={horseList.filter((h) => h.staty.status === "IDLE")}
          reloadHorses={loadHorses}
        />
      )}

      {modalMine && <MineModal setVisible={setModalMine} status={modalMine} />}

      {modalQuests && (
        <QuestsHubModal setVisible={setModalQuests} status={modalQuests} />
      )}

      {modalDerby && <DerbyModal setVisible={setModalDerby} status={modalDerby} horses={horseList} />}

      <ItemBag status={modalItems} closeModal={toggleItemBag} />

      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ""
                  }`}
                onClick={toggleItemBag}
              />
              <button
                className={styles.raceAllButton}
                onClick={() => {
                  setModalRaces(true);
                }}
              />
              <button
                className={styles.upgradeButton}
                onClick={() => {
                  setModalMine(true);
                }}
              />
              <button
                className={styles.questsButton}
                onClick={() => {
                  setModalQuests(true);
                }}
              />
              <button
                className={styles.derbyButton}
                onClick={() => {
                  setModalDerby(true);
                }}
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

      <div className={styles.container}>
        <div className={styles.countRow}>
          {nextRecoveryTs && (
            <span className={styles.nextRecovery}>
              <span className={styles.fullLabel}>
                Next Energy recovery in ‎{" "}
              </span>
              <span className={styles.shortLabel}>⚡ ‎ </span>
              {timeLeft}
            </span>
          )}
          <span className={styles.countHorses}>{horseList.length} Horses</span>
          <div className={styles.orderBy}>
            <label htmlFor="orderBySelect">Order By: </label>
            <select
              id="orderBySelect"
              value={orderBy}
              onChange={handleOrderChange}
            >
              {ORDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.orderRefreshButton}
              onClick={async () => {
                await loadHorses();
                setInformational("Stable reloaded!");
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className={styles.cardHorses}>
          {horseList.map((h) => (
            <SingleHorse key={h.id} horse={h} reloadHorses={loadHorses} />
          ))}

          <div className={styles.addHorse}>
            <div className={styles.addHorseWrapper}>
              <div
                className={styles.plusHorse}
                onClick={() => {
                  window.open(
                    "https://marketplace.roninchain.com/collections/origin-horses",
                    "_blank"
                  );
                }}
              >
                +
              </div>
              <div className={styles.addHorseText}>
                <a
                  href="https://marketplace.roninchain.com/collections/origin-horses"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.addHorseLink}
                >
                  GRAB SOME HORSES AND YOU WILL BE ON YOUR WAY TO RUNNING LIKE A
                  PRO!
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
