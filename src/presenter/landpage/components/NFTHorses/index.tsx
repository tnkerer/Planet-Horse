import React from 'react'
import styles from './styles.module.scss'
import oneHorse from '@/assets/landing-page/nft-horse/1.gif'
import twoHorse from '@/assets/landing-page/nft-horse/2.gif'
import threerHorse from '@/assets/landing-page/nft-horse/3.gif'
import fourHorse from '@/assets/landing-page/nft-horse/4.gif'
import fiveHorse from '@/assets/landing-page/nft-horse/5.gif'
import sixHorse from '@/assets/landing-page/nft-horse/6.gif'
import CategoryHorse from '@/presenter/utils/factories/categoryHorse'

const NFTHorses: React.FC = () => {
  return (
    <div className={styles.container}>
      <span>NFT HORSES</span>
      <div className={styles.horseGrid}>
        <CategoryHorse
          sticker={oneHorse}
          alt={'one'}
        />
        <CategoryHorse
          sticker={twoHorse}
          alt={'one'}
        />
        <CategoryHorse
          sticker={threerHorse}
          alt={'one'}
        />
        <CategoryHorse
          sticker={fourHorse}
          alt={'one'}
        />
        <CategoryHorse
          sticker={fiveHorse}
          alt={'one'}
        />
        <CategoryHorse
          sticker={sixHorse}
          alt={'one'}
        />
      </div>
    </div>
  )
}

export default NFTHorses
