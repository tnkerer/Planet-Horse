// src/components/SingleHorse/index.tsx
import React, { useState } from 'react';
import styles from './styles.module.scss';
import { Horse, Item } from '@/domain/models/Horse';
import { xpProgression } from '@/utils/constants/xp-progression';
import { lvlUpFee } from '@/utils/constants/level-up-fee';
import ModalRaceStart from '../Modals/RaceStart';
import RecoveryCenter from '../Modals/RecoveryCenter';
import ItemBag from '../Modals/ItemBag';
import UpgradeResults, { Upgrades } from '../Modals/UpgradeResults';
import ConfirmModal from '../Modals/ConfirmModal';
import ErrorModal from '../Modals/ErrorModal';
import InfoModal from '../Modals/InfoModal';

interface Props {
  horse: Horse;
  reloadHorses: () => Promise<void>;
}

const rarityColorMap: Record<string, string> = {
  common: '#00aa00',
  uncommon: '#2F35A8',
  rare: '#800080',
  epic: '#ff69b4',
  legendary: '#a78e06',
  mythic: '#E21C21',
};

const sexColorMap: Record<string, string> = {
  male: '#2F35A8',
  female: '#dc207e',
};

const defaultColor = '#919191';

// Map from “item.name” → the filename‐slug for `<slug>_equiped.webp`
const ITEM_SLUG_MAP: Record<string, string> = {
  'Hay': 'hay',
  'Common Saddle': 'saddle',
  'Superior XP Potion': 'xp',
  'Common XP Potion': 'common_xp',
  'Common Horseshoe': 'horseshoe',
  'Pumpers': 'bump',
};

const SingleHorse: React.FC<Props> = ({ horse, reloadHorses }) => {
  const [modalRecovery, setModalRecovery] = useState(false);
  const [modalRaceStart, setModalRaceStart] = useState(false);
  const [showItems, setShowItems] = useState(false);

  // “Confirm level‐up?” dialog
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Hold server‐returned “upgrades” data
  const [upgradesData, setUpgradesData] = useState<Upgrades | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Loading & error/info for API calls
  const [upgrading, setUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Unequip‐item dialog
  const [unequipIndex, setUnequipIndex] = useState<number | null>(null);
  const [unequipText, setUnequipText] = useState('');

  const slug = horse.profile.type_horse_slug;
  const labelColor = rarityColorMap[slug] ?? defaultColor;

  const sexSlug = horse.profile.sex.toLowerCase();
  const sexColor = sexColorMap[sexSlug] ?? defaultColor;

  // Exp utils
  const maxXp: string = (xpProgression[Number(horse.staty.level)] ?? 0).toString();
  const xp = `${horse.staty.exp.toString()}/${maxXp}`;

  // Cost to recover depends on level:
  const recoveryCost = parseInt(horse.staty.level) * 100;

  // Calculate level‐up fees:
  const levelStr = horse.staty.level;
  const phorseFee : string = (lvlUpFee.phorse[levelStr] ?? 0).toString();
  const medalFee : string = (lvlUpFee.medals[levelStr] ?? 0).toString();

  const handleLevelUpClick = () => {
    const text = `Do you want to level up your horse for ${phorseFee} Phorse and ${medalFee} Medal?`;
    setConfirmText(text);
    setShowConfirm(true);
  };

  // Called when the user clicks “Yes” in ConfirmModal:
  const handleDoLevelUp = async () => {
    setShowConfirm(false);
    setUpgrading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `${process.env.API_URL}/horses/${horse.id}/level-up`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }

      const data = (await res.json()) as Upgrades;
      setUpgradesData(data);
      setShowUpgrade(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Level up failed');
    } finally {
      setUpgrading(false);
    }
  };

  // When UpgradeResults is closed, clear it and reload horses:
  const handleUpgradeClose = () => {
    setShowUpgrade(false);
    setUpgradesData(null);
    reloadHorses().catch(console.error);
  };

  //
  // ────────────────────────────────────────────────────────────────────────────
  //   Rendering: The “3 slot” area where we show locked / empty / equipped
  // ────────────────────────────────────────────────────────────────────────────
  //
  //  1) Always show exactly 3 “slots.”
  //  2) Which slots are “locked” depends on level:
  //     • level <  2  → all 3 locked
  //     • 2 ≤ level <  7 → only slot index 0 is unlocked; index 1 & 2 locked
  //     • 7 ≤ level < 15 → slots 0 & 1 unlocked; index 2 locked
  //     • level ≥ 15 → all unlocked
  //
  //  3) For each “unlocked” slot:
  //     – If horse.items has an element at that index, display the
  //       corresponding `<slug>_equiped.webp`, and clicking it opens ConfirmModal.
  //     – Otherwise display `empty.webp`.
  //
  const levelNum = Number(horse.staty.level);
  const MAX_SLOTS = 3;

  function slotState(index: number): 'locked' | 'unlocked' {
    if (levelNum < 2) return 'locked';
    if (levelNum < 7) return index === 0 ? 'unlocked' : 'locked';
    if (levelNum < 15) return index <= 1 ? 'unlocked' : 'locked';
    return 'unlocked';
  }

  // horse.items is now Array<Item>
  const equippedItems: Item[] = horse.items;

  // Unequip handler invoked after confirmation
  const handleDoUnequip = async () => {
    if (unequipIndex === null) return;
    const item = equippedItems[unequipIndex];
    if (!item) return;

    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch(
        `${process.env.API_URL}/horses/${horse.id}/unequip-item`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: item.name, usesLeft: item.uses }),
        }
      );
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }
      setInfoMessage(`Removed ${item.name} from horse #${horse.id}.`);
      await reloadHorses();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to remove item');
    } finally {
      setUnequipIndex(null);
    }
  };

  return (
    <>
      {/* ─────────── 1) UpgradeResults Modal ─────────── */}
      {showUpgrade && upgradesData && (
        <UpgradeResults
          horse={horse}
          upgrades={upgradesData}
          onClose={handleUpgradeClose}
        />
      )}

      {/* ─────────── 2) ErrorModal on API failure ─────────── */}
      {errorMessage && (
        <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {/* ─────────── 3) InfoModal on success ─────────── */}
      {infoMessage && (
        <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />
      )}

      {/* ─────────── 4) Confirm Modal for “Level Up?” ─────────── */}
      {showConfirm && (
        <ConfirmModal
          text={confirmText}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDoLevelUp}
        />
      )}

      {/* ─────────── 5) Confirm Modal for “Unequip Item?” ─────────── */}
      {unequipIndex !== null && equippedItems[unequipIndex] && (
        <ConfirmModal
          text={`Remove ${equippedItems[unequipIndex].name} from horse #${horse.id}?`}
          onClose={() => setUnequipIndex(null)}
          onConfirm={handleDoUnequip}
        />
      )}

      {/* ─────────── 6) Race / Recovery / ItemBag Modals ─────────── */}
      {modalRaceStart && (
        <ModalRaceStart
          status={modalRaceStart}
          horse={horse}
          setVisible={setModalRaceStart}
          onRaceEnd={reloadHorses}
        />
      )}
      {modalRecovery && (
        <RecoveryCenter
          status={modalRecovery}
          horseId={horse.id}
          cost={recoveryCost}
          setVisible={setModalRecovery}
          onRestored={reloadHorses}
        />
      )}
      {showItems && (
        <ItemBag
          status={showItems}
          closeModal={() => setShowItems(false)}
          horse={horse}
          reloadHorses={reloadHorses}
        />
      )}

      {/* ─────────── 7) Main Horse Card with Level‐Up Button ─────────── */}
      <div className={`${styles.singleHorse} type-${horse.profile.type_horse_slug}`}>
        <div className={styles.maskCard}>
          <div className={styles.horseId}>{horse.id}</div>

          <div className={styles.horseGif}>
            <img
              src={`/assets/game/horses/gifs/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-${horse.staty.status.toLowerCase()}.gif`}
              alt={`${horse.profile.name} (${horse.staty.status.toLowerCase()})`}
            />
          </div>

          <div className={styles.horseInfo}>
            <div className={styles.horseWrapper}>
              <div className={styles.horseProfile}>
                <div className={styles.horseItemDescriptionBox}>
                  <div className={styles.horseItemDescription}>
                    NAME: <span>{horse.profile.name.slice(0, 12)}</span>
                  </div>
                  <div className={styles.horseItemDescription}>
                    SEX:{' '}
                    <span className={styles.horseItemDynamic} style={{ color: sexColor }}>
                      {horse.profile.sex}
                    </span>
                  </div>
                </div>

                <div className={styles.horseItemDescription}>
                  HORSE TYPE:{' '}
                  <span className={styles.horseItemDynamic} style={{ color: labelColor }}>
                    {horse.profile.type_horse}
                  </span>
                </div>
                <div className={styles.horseItemDescription}>
                  STABLE TYPE:{' '}
                  <span className={styles.horseItemDescriptionGray}>
                    {horse.profile.type_jockey}
                  </span>
                </div>
                <div className={styles.horseItemDescription}>
                  STATUS: <span>{horse.staty.status}</span>
                </div>
              </div>

              <div className={styles.horseStaty}>
                <div className={styles.horseItemDescription}>
                  LEVEL: <span>{horse.staty.level}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  EXP: <span>{xp}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  POWER: <span>{horse.staty.power}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  SPRINT: <span>{horse.staty.sprint}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  SPEED: <span>{horse.staty.speed}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  ENERGY: <span>{horse.staty.energy}</span>
                </div>
              </div>

              {/* ─────────── HORSE ITEMS / SLOT RENDERING ─────────── */}
              <div className={styles.horseItems}>
                {Array.from({ length: MAX_SLOTS }).map((_, idx) => {
                  const state = slotState(idx);
                  if (state === 'locked') {
                    return (
                      <div key={idx} className={styles.singleItem}>
                        <img src="/assets/items/locked.webp" alt="Locked" />
                      </div>
                    );
                  }

                  // unlocked slot
                  const equipped = equippedItems[idx];
                  if (!equipped) {
                    return (
                      <div key={idx} className={styles.singleItem}>
                        <img src="/assets/items/empty.webp" alt="Empty slot" />
                      </div>
                    );
                  }

                  // slot unlocked & item present → show equipped image, clickable to unequip
                  const slugName = ITEM_SLUG_MAP[equipped.name] || '';
                  return (
                    <div key={idx} className={styles.singleItem}>
                      <img
                        src={`/assets/items/${slugName}_equiped.webp`}
                        alt={equipped.name}
                        onClick={() => {
                          setUnequipIndex(idx);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.horseButtons}>
              {/* ITEMS BUTTON */}
              <div className={styles.singleButton}>
                <button
                  className={styles.itemsButton}
                  onClick={() => {
                    console.log(`current horse is ${horse.id}`);
                    setShowItems(true);
                  }}
                />
              </div>

              {/* RESTORE BUTTON */}
              <div className={styles.singleButton}>
                <button
                  className={styles.restoreButton}
                  onClick={() => setModalRecovery(true)}
                  disabled={horse.staty.status !== 'BRUISED'}
                />
              </div>

              {/* START RACE BUTTON */}
              <div className={styles.singleButton}>
                <button
                  className={styles.startButton}
                  onClick={() => setModalRaceStart(true)}
                  disabled={horse.staty.status !== 'IDLE'}
                />
              </div>
            </div>
          </div>

          {/* ─────────── LEVEL UP BUTTON (only if upgradable) ─────────── */}
          {horse.staty.upgradable && (
            <div className={styles.levelUpButton} onClick={handleLevelUpClick}>
              <img src="/assets/game/horses/level-up.gif" alt="Level Up" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SingleHorse;
