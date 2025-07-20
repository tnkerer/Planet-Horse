import React from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';

interface Props {
  quantity: number;
  max: number;
  itemName: string;
  onQuantityChange: (q: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmMultipleDeposit: React.FC<Props> = ({
  quantity, max, itemName,
  onQuantityChange, onClose, onConfirm,
}) => (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
        <Image src={closeIcon} alt="Close" width={24} height={24} />
      </button>
      <div className={styles.text}>
        Deposit <strong>{quantity}</strong> <em>{itemName}</em>
        {quantity > 1 ? 's' : ''}?
      </div>
      <div className={styles.sliderContainer}>
        <input
          type="range"
          min={1} max={max}
          value={quantity}
          onChange={e => onQuantityChange(Number(e.target.value))}
        />
        <output className={styles.sliderValue}>{quantity}</output>
      </div>
      <div className={styles.buttons}>
        <button className={styles.yesBtn} onClick={onConfirm} />
        <button className={styles.noBtn} onClick={onClose} />
      </div>
    </div>
  </div>
);

export default ConfirmMultipleDeposit;
