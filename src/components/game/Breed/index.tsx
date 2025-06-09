import Image from 'next/image';
import ItemBag from '../Modals/ItemBag';
import styles from './styles.module.scss';
import { useWallet } from '@/contexts/WalletContext';
import { useUser } from '@/contexts/UserContext';
import { useState } from 'react';

import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import medalIcon from '@/assets/icons/medal.gif';

type Props = {
  changeView: (view: string) => void
}

const Breed = ({ changeView }: Props) => {
  const [modalItems, setModalItems] = useState(false);
    const { phorse, medals, updateBalance } = useUser();
    const { isAuthorized, address } = useWallet();

    const toggleItemBag = () => setModalItems((prev) => !prev);
  
  return (
    <>
      {/* Item‐Bag Modal */}
      <ItemBag
        status={modalItems}
        closeModal={toggleItemBag}
      />

      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                onClick={toggleItemBag}
                aria-label="Open Bag"
              >
                <span className={styles.notificationBadge}></span>
              </button>

              <button className={styles.breedButton} onClick={() => changeView('breed')} aria-label='Breeding' />
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src={phorseToken} alt="phorse coin" />
            <span>{phorse?.toFixed(0) || 0}</span>
            <Image width={29} height={40} src={medalIcon} alt="medals" />
            <span>{medals?.toFixed(0) || 0}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>

      </div>
    </>
  )
}

export default Breed