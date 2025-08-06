// src/components/game/Modals/RaceStart/index.tsx
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import close from '@/assets/game/pop-up/fechar.png';
import HorseRace from '../../HorseRacing';
import RaceFinish from '../../RaceFinish';
import { Horse } from '@/domain/models/Horse';
import ErrorModal from '../ErrorModal';
import Image from 'next/image';

interface Props {
  setVisible: Dispatch<SetStateAction<boolean>>;
  status: boolean;
  horse: Horse;
  onRaceEnd: () => Promise<void>;
}

// The new HorseResults now matches your API (using tokenRewards)
export interface HorseResults {
  position: number;
  tokenReward: number;
  medalReward: number;
  xpReward: number;
  droppedItems: string[];
  droppedChests: number[];
}

const ModalRaceStart: React.FC<Props> = ({
  setVisible,
  status,
  horse,
  onRaceEnd,
}) => {
  const [startRace, setStartRace] = useState<boolean>(false);
  const [racing, setRacing] = useState<boolean>(false);
  const [raceFinish, setRaceFinish] = useState<boolean>(false);

  // Store exactly what the API returns (position, tokenRewards, medalReward)
  const [horseResult, setHorseResult] = useState<HorseResults | null>(null);

  // In case of API error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1) Once we have a valid HorseResults, begin “start → run → finish”
  function startingRace(): void {
    setStartRace(true);
    setRacing(false);
    setRaceFinish(false);

    // After 1.5 s, show the “running” phase
    setTimeout(() => {
      raceRunning();
    }, 1500);
  }

  // 2) Show the HorseRace component—**do NOT** auto‐finish here.
  //    Instead, wait for HorseRace to call `horseRacingFinish()`.
  function raceRunning(): void {
    setStartRace(false);
    setRacing(true);
    setRaceFinish(false);
    // ← removed: setTimeout(() => finishRace(), 1000)
  }

  // 3) Final step: show finish UI, then notify parent to reload data
  function finishRace() {
    setStartRace(false);
    setRacing(false);
    setRaceFinish(true);
    onRaceEnd();
  }

  // 4) When `status` becomes true and `horseResult` is still null, call API once
  useEffect(() => {
    if (!status) {
      // Modal closed → reset everything
      setStartRace(false);
      setRacing(false);
      setRaceFinish(false);
      setHorseResult(null);
      setErrorMessage(null);
      return;
    }
    if (status && horseResult === null) {
      (async () => {
        setErrorMessage(null);
        try {
          const res = await fetch(
            `${process.env.API_URL}/horses/${horse.id}/start-race`,
            {
              method: 'PUT',
              credentials: 'include',
            }
          );
          if (!res.ok) {
            // Try to read a JSON error body
            let errText = `HTTP ${res.status}`;
            try {
              const errJson = await res.json();
              if (errJson?.message) {
                errText = errJson.message;
              }
            } catch {
              // ignore parse errors
            }
            throw new Error(errText);
          }

          // Parse HorseResults exactly as { position, tokenRewards, medalReward }
          const data = (await res.json()) as HorseResults;
          setHorseResult(data);

          // Now that we have data, kick off animations
          startingRace();
        } catch (e: any) {
          setErrorMessage(e.message || 'Failed to start race');
        }
      })();
    }
  }, [status, horse, horseResult, onRaceEnd]);

  // 5) If the API errored, show ErrorModal
  if (errorMessage) {
    return (
      <ErrorModal
        text={errorMessage}
        onClose={() => {
          setErrorMessage(null);
          setVisible(false);
        }}
      />
    );
  }

  // 6) Finally, render the normal modal layers
  return (
    <div
      className={`
        ${styles.modalRaceStart}
        ${status ? styles.modalActive : styles.modalInactive}
      `}
    >
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* X button to abort/close */}
          <div className={styles.modalClose} onClick={() => setVisible(false)}>
            <Image width={30} height={30} src={close} alt="Close" />
          </div>

          <div className={styles.modalContainer}>
            <div className={styles.modalInner}>
              {/* 1) “Start Race” animation */}
              {startRace && <div className={styles.modalStartRace}></div>}

              {/* 2) “Running” phase: show HorseRace */}
              {racing && horseResult && (
                <div className={styles.modalRacing}>
                  <HorseRace
                    horseRacingFinish={finishRace}
                    horse={horse}
                    horseResult={horseResult}
                  />
                </div>
              )}

              {/* 3) “Finish” phase: show RaceFinish */}
              {raceFinish && horseResult && (
                <RaceFinish horseResult={horseResult} horse={horse} />
              )}
            </div>
          </div>

          <div className={styles.modalMask}></div>
        </div>
      </div>
    </div>
  );
};

export default ModalRaceStart;
