import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import close from '@/assets/game/pop-up/fechar.png';
import ErrorModal from '../ErrorModal';

interface Props {
  setVisible: Dispatch<SetStateAction<boolean>>;
  status: boolean;
  horseId: number;
  cost: number;
  onRestored: () => void;
}

const RecoveryCenter: React.FC<Props> = ({
  setVisible,
  status,
  horseId,
  cost,
  onRestored,
}) => {
  const fullText = `Do you wish to buy a treatment for ${cost} PHORSE?`;
  const [displayedText, setDisplayedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Typewriter effect for the prompt
  useEffect(() => {
    if (!status) return;
    setDisplayedText('');
    setErrorMessage(null);

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [status, fullText]);

  if (!status) return null;

  // Called when the user clicks "BUY" to restore
  const handleRestore = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `${process.env.API_URL}/horses/${horseId}/restore`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) {
        let errText = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) errText = errJson.message;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errText);
      }

      // Success: inform parent to refresh, then close
      onRestored();
      setVisible(false);
    } catch (e: any) {
      setErrorMessage(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* If there’s an errorMessage, show a full‐screen ErrorModal */}
      {errorMessage && (
        <ErrorModal
          text={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <div
        className={`
          ${styles.modalRecovery}
          ${status ? styles.modalActive : styles.modalInactive}
        `}
      >
        <div className={styles.modalFull}>
          <div className={styles.modalContent}>
            {/* “X” Close button */}
            <div
              className={styles.modalClose}
              onClick={() => setVisible(false)}
            >
              <Image src={close} alt="Close" width={30} height={30} />
            </div>

            {/* Dialog box with typewriter text */}
            <div className={styles.dialogContainer}>
              <Image
                src="/assets/dialog_box.png"
                alt="Dialog box"
                width={300}
                height={100}
              />
              <div className={styles.dialogText}>
                {displayedText}
                <span className={styles.cursor}>|</span>
              </div>
            </div>

            {/* BUY Button */}
            <button
              className={styles.buyButton}
              onClick={handleRestore}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RecoveryCenter;
