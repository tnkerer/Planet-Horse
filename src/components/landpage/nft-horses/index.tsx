import React, { useState, useEffect, useContext } from 'react'
import styles from './styles.module.scss'
import CategoryHorse from '../category-horse'
import commonHorse from '@/assets/landing-page/gameplay/cards/common-horse.gif'
import rareHorse from '@/assets/landing-page/gameplay/cards/rare-horse.gif'
import superRareHorse from '@/assets/landing-page/gameplay/cards/super-rare-horse.gif'
import epicHorse from '@/assets/landing-page/gameplay/cards/epic-horse.gif'
import legenderyHorse from '@/assets/landing-page/gameplay/cards/legendary-horse.gif'
import superLegenderyHorse from '@/assets/landing-page/gameplay/cards/super-legendary-horse.gif'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

interface Props {
  scrollValueToAnimate?: number
}

const NFTHorses: React.FC<Props> = ({ scrollValueToAnimate }) => {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useContext(ScrollYValueContext)
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const elementAppearsToUser = scrollY >= scrollValueToAnimate
    const screenWidthResolution = window.innerWidth
    elementAppearsToUser && setScrolled(true)
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  return (
    <div className={styles.container}>
      <span style={{
        opacity: scrolled || screenWidth <= 810 ? 1 : 0
      }}>
        NFT HORSES
        <span className={styles.diagonalLine}>
          <span className={styles.circle} />
        </span>
        <span className={styles.horizontalLine} />
      </span>
      <div className={styles.horseGrid}>
        <CategoryHorse
          sticker={commonHorse}
          alt={'Common horse'}
          animationClass={scrollY >= 1600 && styles.animationLeftToRight}
        />
        <CategoryHorse
          sticker={rareHorse}
          alt={'Raro horse'}
          animationClass={scrollY >= 1600 && styles.animationRightToLeft}
        />
        <CategoryHorse
          sticker={superRareHorse}
          alt={'Super rate horse'}
          animationClass={scrollY >= 2000 && styles.animationLeftToRight}
        />
        <CategoryHorse
          sticker={epicHorse}
          alt={'Epic horse'}
          animationClass={scrollY >= 2000 && styles.animationRightToLeft}
        />
        <CategoryHorse
          sticker={legenderyHorse}
          alt={'Legendery horse'}
          animationClass={scrollY >= 2400 && styles.animationLeftToRight}
        />
        <CategoryHorse
          sticker={superLegenderyHorse}
          alt={'Super legendery horse'}
          animationClass={scrollY >= 2400 && styles.animationRightToLeft}
        />
      </div>
    </div>
  )
}

export default NFTHorses
