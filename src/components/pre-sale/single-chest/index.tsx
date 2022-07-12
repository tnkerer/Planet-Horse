import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import chestImage from '@/utils/hooks/chest-image'

type Chest = {
  id: number
  name: string
  src: string
  value: string
}

interface Props {
  chest: Chest
}

const SingleChest: React.FC<Props> = ({ chest }) => {
  const { image } = chestImage(chest.src)
  return (
    <>
    <div className={styles.singleChest}>
      <div className={styles.singleChestImage}>
        {image && <Image src={image} />}
        <div className={styles.singleChestButtonArea}>
            <button className={styles.buyButton}
                /* onClick={setPopUp('chest')} */
            ></button>
        </div>
      </div>
    </div>
    </>
  )
}

export default SingleChest
