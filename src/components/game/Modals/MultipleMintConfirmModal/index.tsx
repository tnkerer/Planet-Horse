import React from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';

interface ConfirmMultipleMintProps {
  /** Number of items to mint */
  quantity: number;
  /** Maximum quantity user can mint */
  max: number;
  /** Called when quantity slider changes */
  onQuantityChange: (q: number) => void;
  /** Called when user closes the modal */
  onClose: () => void;
  /** Called when user confirms minting */
  onConfirm: () => void;
  /** Item name to display */
  itemName: string;
}

const ConfirmMultipleMint: React.FC<ConfirmMultipleMintProps> = ({
  quantity,
  max,
  onQuantityChange,
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Close “X” */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <Image src={closeIcon} alt="Close" width={24} height={24} />
        </button>

        {/* Dynamic question */}
        <div className={styles.text}>
          Mint <strong>{quantity}</strong> <em>{itemName}</em>
          {quantity > 1 ? 's' : ''}?
        </div>

        {/* Quantity slider */}
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min={1}
            max={max}
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
          />
          <output className={styles.sliderValue}>{quantity}</output>
        </div>

        {/* Confirm / Cancel */}
        <div className={styles.buttons}>
          <button className={styles.yesBtn} onClick={onConfirm} />
          <button className={styles.noBtn} onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default ConfirmMultipleMint;
