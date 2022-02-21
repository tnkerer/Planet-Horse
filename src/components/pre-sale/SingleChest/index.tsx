import React from 'react'
import styles from './styles.module.scss'
import chestImage from '../../../hooks/ChestImage'
import Image from 'next/image'

interface Chest {
  id: number
  name: string
  src: string
  value: string
}
interface Props {
  chest: Chest
}

const SingleChest: React.FC<Props> = ({ chest }) => {
  const { loading, image } = chestImage(chest.src)
  return (
    <>
    <div className={styles.singleChest}>
      <div className={styles.singleChestImage}>
        {loading
          ? (null)
          : (
            <Image src={image} />
          )
        }
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
