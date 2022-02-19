import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import tape from '@/assets/landing-page/nft-horse/tape.png'

interface Props {
  sticker: StaticImageData
  alt: string
}

const CategoryHorse: React.FC<Props> = ({ sticker, alt }) => {
  return (
    <div className={styles.container}>
      <div className={styles.tapeContainer}>
        <Image src={tape} alt={alt} />
      </div>
      <Image src={sticker} alt={alt} />
    </div>
  )
}

export default CategoryHorse
