import React, { useState } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import ConfirmModal from '../ConfirmModal';

interface Props {
  currentNickname?: string;
  onClose: () => void;
  onConfirm: (nickname: string) => Promise<void>;
}

const NicknameModal: React.FC<Props> = ({ currentNickname, onClose, onConfirm }) => {
  const [nickname, setNickname] = useState(currentNickname ?? '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    if (nickname.trim().length === 0) {
      setError('Nickname cannot be empty');
      return;
    }
    if (nickname.length > 16) {
      setError('Nickname must be at most 16 characters');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(nickname);
      // On success: close everything
      setShowConfirm(false);
      onClose();
    } catch (err: any) {
      // On error: close confirm modal, keep NicknameModal open
      setShowConfirm(false);
      setError(err.message || 'Failed to change nickname');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <Image src={closeIcon} alt="Close" width={24} height={24} />
        </button>

        <div className={styles.text}>Set a new nickname for your horse:</div>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={styles.nicknameInput}
          placeholder="Enter nickname (max 16 chars)"
          maxLength={16}
        />

        {error && <div className={styles.errorText}>{error}</div>}

        <div className={styles.buttons}>
          <button className={styles.yesBtn} onClick={handleProceed} />
          <button className={styles.noBtn} onClick={onClose} />
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          text={
            <>
              Are you sure you want to name this horse <strong>{nickname}</strong>?<br />
              <span style={{ color: 'red' }}>This will cost 500 PHORSE!</span>
            </>
          }
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export default NicknameModal;
