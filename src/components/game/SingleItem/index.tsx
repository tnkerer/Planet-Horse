import React from 'react'
import styles from './styles.module.scss'
import getItemImage from '@/utils/hooks/single-item-image'
import { Items } from '@/domain/models/Item'

interface Props {
  item: Items
}

const SingleHorse: React.FC<Props> = ({ item }) => {
  const { loading, image } = getItemImage(item)
  
  return (
        <>
        <div className={styles.itemContent}>
            <div className={styles.itemBadge}>{item.value}</div>
            <div className={styles.itemGif}>
              {loading
                ? (null)
                : (<img src={image.src} />)}
            </div>
        </div>
        </>
  )
}

export default SingleHorse
