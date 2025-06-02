import React, { useState } from 'react';
import styles from './styles.module.scss';
import { Horse } from '@/domain/models/Horse';
import { xpProgression } from '@/utils/constants/xp-progression';
import { lvlUpFee } from '@/utils/constants/level-up-fee';
import ModalRaceStart from '../Modals/RaceStart';
import RecoveryCenter from '../Modals/RecoveryCenter';
import ItemBag from '../Modals/ItemBag';
import UpgradeResults, { Upgrades } from '../Modals/UpgradeResults';
import ConfirmModal from '../Modals/ConfirmModal';
import ErrorModal from '../Modals/ErrorModal';

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

  // Loading & error for API call
  const [upgrading, setUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slug = horse.profile.type_horse_slug;
  const labelColor = rarityColorMap[slug] ?? defaultColor;

  const sexSlug = horse.profile.sex.toLowerCase();
  const sexColor = sexColorMap[sexSlug] ?? defaultColor;

  // Exp Utils
  const maxXp: string = (xpProgression[Number(horse.staty.level)] ?? 0).toString();
  const xp = `${horse.staty.exp.toString()}/${maxXp}`;

  // Cost to recover depends on level:
  const recoveryCost = parseInt(horse.staty.level) * 100;

  // Calculate level‐up fees:
  //   phorseFee = lvlUpFree.phorse[levelStr]
  //   medalFee  = lvlUpFree.medals[levelStr]
  const levelStr = horse.staty.level;
  const phorseFee : string = (lvlUpFee.phorse[levelStr] ?? 0).toString();
  const medalFee : string = (lvlUpFee.medals[levelStr] ?? 0).toString();

  const handleLevelUpClick = () => {
    // Build the question text:
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
          credentials: 'include'
        }
      );

      // If non‐200, attempt to extract { message } from JSON
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) {
            msg = errJson.message;
          }
        } catch {
          /* ignore parse error */
        }
        throw new Error(msg);
      }

      // Parse the Upgrades object
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
        <ErrorModal
          text={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* ─────────── 3) Confirm Modal for “Level Up?” ─────────── */}
      {showConfirm && (
        <ConfirmModal
          text={confirmText}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDoLevelUp}
        />
      )}

      {/* ─────────── 4) Race / Recovery / ItemBag Modals ─────────── */}
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
        />
      )}

      {/* ─────────── 5) Main Horse Card with Level‐Up Button ─────────── */}
      <div className={`${styles.singleHorse} type-${horse.profile.type_horse_slug}`}>
        <div className={styles.maskCard}>
          <div className={styles.horseId}>{horse.id}</div>

          <div className={styles.horseGif}>
            <img
              src={`/assets/game/horses/gifs/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-${horse.staty.status}.gif`}
              alt={`${horse.profile.name} (${horse.staty.status})`}
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

              <div className={styles.horseItems}>
                {horse.items.map((item) => (
                  <div key={item.id} className={styles.singleItem}>
                    {item.id}
                  </div>
                ))}
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

          {/* ─────────── 6) LEVEL UP BUTTON (only if upgradable) ─────────── */}
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
