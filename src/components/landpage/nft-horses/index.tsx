import React from 'react'
import styles from './styles.module.scss'
import CategoryHorse from '../category-horse'
import commonHorse from '@/assets/landing-page/gameplay/cards/common-horse.gif'
import raroHorse from '@/assets/landing-page/gameplay/cards/raro-horse.gif'
import superRareHorse from '@/assets/landing-page/gameplay/cards/super-rare-horse.gif'
import epicHorse from '@/assets/landing-page/gameplay/cards/epic-horse.gif'
import legenderyHorse from '@/assets/landing-page/gameplay/cards/legendery-horse.gif'
import superLegenderyHorse from '@/assets/landing-page/gameplay/cards/super-legendery-horse.gif'

const NFTHorses: React.FC = () => {
  return (
    <div className={styles.container}>
      <span>NFT HORSES</span>
      <div className={styles.horseGrid}>
        <CategoryHorse
          sticker={commonHorse}
          alt={'Common horse'}
        />
        <CategoryHorse
          sticker={raroHorse}
          alt={'Raro horse'}
        />
        <CategoryHorse
          sticker={superRareHorse}
          alt={'Super rate horse'}
        />
        <CategoryHorse
          sticker={epicHorse}
          alt={'Epic horse'}
        />
        <CategoryHorse
          sticker={legenderyHorse}
          alt={'Legendery horse'}
        />
        <CategoryHorse
          sticker={superLegenderyHorse}
          alt={'Super legendery horse'}
        />
      </div>
    </div>
  )
}

export default NFTHorses
