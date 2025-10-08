// src/components/SingleHorse/index.tsx
import React, { useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { Horse, Item } from '@/domain/models/Horse';
import { xpProgression } from '@/utils/constants/xp-progression';
import { lvlUpFee, lvlUpRarityMultiplier } from '@/utils/constants/level-up-fee';
import ModalRaceStart from '../Modals/RaceStart';
import RecoveryCenter from '../Modals/RecoveryCenter';
import ModalReward from '../Modals/Reward';
import ItemBag from '../Modals/ItemBag';
import UpgradeResults, { Upgrades } from '../Modals/UpgradeResults';
import ConfirmModal from '../Modals/ConfirmModal';
import ErrorModal from '../Modals/ErrorModal';
import InfoModal from '../Modals/InfoModal';
import { itemModifiers, items } from '@/utils/constants/items'
import NicknameModal from '../Modals/NicknameModal';

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

const statColor = '#1fa050'

const defaultColor = '#919191';

// Map from “item.name” → the filename‐slug for `<slug>_equiped.webp`
const ITEM_SLUG_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(items).map(([name, data]) => [name, data.src])
);

const RARITY_MOD: Record<string, number> = {
  "common": 1,
  "uncommon": 1.3,
  "rare": 1.6,
  "epic": 1.9,
  "legendary": 2.2,
  "mythic": 2.5
};

const BASE_DENOM = 24;

const SingleHorse: React.FC<Props> = ({ horse, reloadHorses }) => {
  const [modalRecovery, setModalRecovery] = useState(false);
  const [modalRaceStart, setModalRaceStart] = useState(false);
  const [modalRewards, setModalRewards] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

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

  const slug = horse.profile.type_horse_slug;
  const labelColor = rarityColorMap[slug] ?? defaultColor;

  const sexSlug = horse.profile.sex.toLowerCase();
  const sexColor = sexColorMap[sexSlug] ?? defaultColor;

  const formatXp = (n: number) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toString();
  };
  // Exp utils
  const maxXp: string = (xpProgression[Number(horse.staty.level)] ?? 0).toString();
  const xp = `${formatXp(Number(horse.staty.exp))}/${formatXp(Number(maxXp))}`;

  // Cost to recover depends on level:
  const recoveryMod = RARITY_MOD[slug] * (260 / BASE_DENOM);
  const recoveryCost = Number((parseInt(horse.staty.level) * recoveryMod).toFixed(2));

  const levelStr = Number(horse.staty.level);
  const rarityStr = horse.profile.type_horse_slug;

  function getLevelUpFee(level: number, raritySlug: string) {
    // Normalize: "common" -> "Common"
    const rarityKey = (raritySlug.charAt(0).toUpperCase() + raritySlug.slice(1))


    const basePhorse = lvlUpFee.phorse[level] ?? 0;
    const baseMedals = lvlUpFee.medals[level] ?? 0;
    const mult = lvlUpRarityMultiplier[rarityKey];
    if (!mult) return { phorse: basePhorse, medals: baseMedals };

    return {
      phorse: Math.ceil(basePhorse * mult.phorse),
      medals: Math.ceil(baseMedals * mult.medals),
    };
  }

  const fees = getLevelUpFee(levelStr, rarityStr);
  const phorseFee: string = fees.phorse.toString();
  const medalFee: string = fees.medals.toString();

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

  function slotState(index: number): 'locked' | 'unlocked' {
    if (levelNum < 2) return 'locked';
    if (levelNum < 7) return index === 0 ? 'unlocked' : 'locked';
    if (levelNum < 15) return index <= 1 ? 'unlocked' : 'locked';
    return 'unlocked';
  }

  // horse.items is now Array<Item>
  const equippedItems: Item[] = horse.items;

  // Separate trophy and non-trophy items
  const trophyItem = equippedItems.find((it) => items[it.name]?.trophy);
  const regularItems = equippedItems.filter((it) => !items[it.name]?.trophy);

  const extraStats = equippedItems.reduce(
    (acc, item) => {
      const mod = itemModifiers[item.name];
      if (!mod) return acc;
      acc.extraPwr += mod.extraPwr || 0;
      acc.extraSpt += mod.extraSpt || 0;
      acc.extraSpd += mod.extraSpd || 0;
      return acc;
    },
    { extraPwr: 0, extraSpt: 0, extraSpd: 0 }
  );

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
      // setInfoMessage(`Removed ${item.name} from horse #${horse.id}.`);
      await reloadHorses();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to remove item');
    } finally {
      setUnequipIndex(null);
    }
  };

  useEffect(() => {
    if (horse.staty.status !== 'BREEDING' || !horse.staty.started) {
      setCountdown(null);
      return;
    }

    const end = new Date(horse.staty.started).getTime() + 24 * 60 * 60 * 1000;

    const update = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`
      );
    };

    update(); // initial run
    const id = setInterval(update, 1000); // update every second
    return () => clearInterval(id);
  }, [horse.staty.status, horse.staty.started]);

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
      {modalRewards && (
        <ModalReward
          closeModal={() => setModalRewards(false)}
          horseId={horse.id}
          status={true}
        />
      )}
      {showNicknameModal && (
        <NicknameModal
          currentNickname={horse.profile.nickname}
          onClose={() => setShowNicknameModal(false)}
          onConfirm={async (nickname) => {
            const res = await fetch(`${process.env.API_URL}/horses/${horse.id}/change-nickname`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nickname }),
            });

            if (!res.ok) {
              let msg = `HTTP ${res.status}`;
              try {
                const errJson = await res.json();
                if (errJson?.message) msg = errJson.message;
              } catch { }
              throw new Error(msg); // Let NicknameModal handle it
            }

            await reloadHorses();
          }}
        />
      )}


      {/* ─────────── 7) Main Horse Card with Level‐Up Button ─────────── */}
      <div className={`${styles.singleHorse} type-${horse.profile.type_horse_slug}`}>
        <div className={styles.maskCard}>
          <div className={styles.horseId}>{horse.id}</div>

          <div className={styles.horseGif}>
            {horse.staty.status === 'BREEDING' ? (
              <img
                src="/assets/game/horses/breeding.gif"
                alt={`${horse.profile.name} (breeding)`}
              />
            ) : (
              <img
                src={`/assets/game/horses/gifs/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-${horse.staty.status === 'IDLE' ? 'running' : horse.staty.status.toLowerCase()}.gif`}
                alt={`${horse.profile.name} (${horse.staty.status === 'IDLE' ? 'running' : horse.staty.status.toLowerCase()})`}
              />
            )}

            {/* Wolf overlay (only if the right trophy is equipped) */}
            {trophyItem?.name === 'Wolfie Trophy' && horse.staty.status === 'IDLE' && (
              <img
                className={styles.wolfOverlay}
                src="/assets/game/horses/wolfie.gif"
                alt="Wolfie companion"
                aria-hidden="true"
              />
            )}
            {trophyItem?.name === 'Red Wolfie Trophy' && horse.staty.status === 'IDLE' && (
              <img
                className={styles.wolfOverlay}
                src="/assets/game/horses/red-wolfie.gif"
                alt="Red Wolfie companion"
                aria-hidden="true"
              />
            )}
          </div>

          <div className={styles.horseInfo}>
            <div className={styles.horseWrapper}>
              <div className={styles.horseProfile}>

                <div className={styles.horseItemDescriptionName}>
                  {' '}
                  <span>
                    {horse.profile.nickname && horse.profile.nickname.trim().length > 0
                      ? horse.profile.nickname.slice(0, 18)
                      : horse.profile.name.slice(0, 18)}
                  </span>
                  {/* Edit icon button */}
                  <button
                    type="button"
                    onClick={() => setShowNicknameModal(true)}
                    className={styles.editButton}
                  >
                    <img src="/assets/icons/edit.svg" alt="Edit" />
                  </button>
                </div>
                <div className={styles.horseItemDescriptionBox}>
                  <div className={styles.horseItemDescription}>
                    {' '}
                    <span className={styles.horseItemDynamic} style={{ color: sexColor }}>
                      {horse.profile.sex}
                    </span>
                  </div>
                </div>

                <div className={styles.horseItemDescription}>
                  {' '}
                  <span className={styles.horseItemDynamic} style={{ color: labelColor }}>
                    {horse.profile.type_horse}
                  </span>
                </div>
                <div className={styles.horseItemDescription}>
                  GEN:{' '}
                  <span className={styles.horseItemDescriptionGray}>
                    {horse.staty.generation}
                  </span>
                </div>
                <div className={styles.horseItemDescription}>
                  BREEDS: <span>{horse.staty.breeding}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  <span>{horse.staty.status}</span>
                </div>
                {horse.staty.status === 'BREEDING' && (
                  <div className={styles.horseItemDescription}>
                    {' '}
                    <span>
                      {countdown ?? horse.staty.started}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.horseStaty}>
                <div className={styles.horseItemDescription}>
                  LEVEL: <span>{horse.staty.level}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  EXP: <span>{xp}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  PWR: <span>{horse.staty.power}</span>
                  {extraStats.extraPwr > 0 && (
                    <span style={{ color: statColor }}> +{extraStats.extraPwr}</span>
                  )}
                </div>
                <div className={styles.horseItemDescription}>
                  SPT: <span>{horse.staty.sprint}</span>
                  {extraStats.extraSpt > 0 && (
                    <span style={{ color: statColor }}> +{extraStats.extraSpt}</span>
                  )}
                </div>

                <div className={styles.horseItemDescription}>
                  SPD: <span>{horse.staty.speed}</span>
                  {extraStats.extraSpd > 0 && (
                    <span style={{ color: statColor }}> +{extraStats.extraSpd}</span>
                  )}
                </div>
                <div className={styles.horseItemDescription}>
                  ENERGY: <span>{horse.staty.energy}</span>
                </div>
              </div>

              {/* ─────────── HORSE ITEMS / SLOT RENDERING ─────────── */}
              <div className={styles.horseItems}>
                {/* 1) Trophy slot always first */}
                <div className={styles.singleItem}>
                  {trophyItem ? (
                    <>
                      <img
                        src={`/assets/items/${ITEM_SLUG_MAP[trophyItem.name]}_equiped.webp`}
                        alt={trophyItem.name}
                        onClick={() =>
                          setUnequipIndex(equippedItems.findIndex((it) => it.id === trophyItem.id))
                        }
                      />
                      {trophyItem.uses > 0 && trophyItem.breakable && (
                        <div className={styles.itemBadge}>{trophyItem.uses}</div>
                      )}
                    </>
                  ) : (
                    <img src="/assets/items/empty_trophy.webp" alt="Empty Trophy Slot" />
                  )}
                </div>

                {/* 2) Regular 3 slots */}
                {Array.from({ length: 3 }).map((_, idx) => {
                  const state = slotState(idx);
                  if (state === "locked") {
                    return (
                      <div key={idx} className={styles.singleItem}>
                        <img src="/assets/items/locked.webp" alt="Locked" />
                      </div>
                    );
                  }

                  // unlocked slot
                  const equipped = regularItems[idx];
                  if (!equipped) {
                    return (
                      <div key={idx} className={styles.singleItem}>
                        <img src="/assets/items/empty.webp" alt="Empty slot" />
                      </div>
                    );
                  }

                  // slot unlocked & item present → show equipped image
                  const slugName = ITEM_SLUG_MAP[equipped.name] || "";
                  return (
                    <div key={idx} className={styles.singleItem}>
                      <img
                        src={`/assets/items/${slugName}_equiped.webp`}
                        alt={equipped.name}
                        onClick={() =>
                          setUnequipIndex(equippedItems.findIndex((it) => it.id === equipped.id))
                        }
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.endsWith(".gif")) {
                            target.src = `/assets/items/${slugName}_equiped.gif`;
                          }
                        }}
                      />
                      {equipped.uses > 0 && equipped.breakable && (
                        <div className={styles.itemBadge}>{equipped.uses}</div>
                      )}
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
                >ITEMS</button>
              </div>

              {/* RESTORE BUTTON */}
              <div className={styles.singleButton}>
                <button
                  className={styles.restoreButton}
                  onClick={() => setModalRecovery(true)}
                  disabled={horse.staty.status !== 'BRUISED'}
                >RESTORE</button>
              </div>

              {/* REWARDS BUTTON */}
              <div className={styles.singleButton}>
                <button
                  className={styles.rewardsButton}
                  onClick={() => setModalRewards(true)}
                >REWARDS</button>
              </div>

              {/* START RACE BUTTON */}
              <div className={styles.singleButton}>
                <button
                  className={styles.startButton}
                  onClick={() => setModalRaceStart(true)}
                  disabled={horse.staty.status !== 'IDLE'}
                >RACE</button>
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
