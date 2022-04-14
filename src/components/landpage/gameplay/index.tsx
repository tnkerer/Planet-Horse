import React from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import tvImage from '@/assets/landpage/tv.webp'
import racingImage from '@/assets/landpage/racing.gif'

import whitepaperImage from '@/assets/landpage/whitepaper.webp'
import whitepaperHoverImage from '@/assets/landpage/whitepaper-mouse.webp'
import arboresImage from '@/assets/landpage/arbores.webp'

const Gameplay: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={`${styles.container_content} ${styles.animation}`}>
        <slot className={styles.content_gameplay}>
          <div className={styles.gameplay_line__vertical} />
          <div className={styles.gameplay_content}>
            <div className={styles.content_head}>
              <h1 className={styles.head_title}>GAMEPLAY</h1>

              <u className={styles.head_option}>RACING</u>
              <u className={styles.head_option}>BUY / SELL</u>
              <u className={styles.head_option}>UPGRADE</u>
            </div>
            <div className={styles.gameplay_body}>
              <span className={styles.gameplay_description__paragraph1}>In the Race Mode you can play PvP or PvC.</span>
              <span className={styles.gameplay_description__paragraph2}>
                The rewards for the winners will be:
                experience points, materials, items
                and tokens.
              </span>
            </div>
          </div>
        </slot>
        <slot className={styles.content_horses}>
          <div className={styles.horses_content}>
            <div className={styles.content_viewfinder}>
              <Image layout='fill' src={racingImage} />
            </div>
            <div className={styles.content_tv}>
              <Image layout='fill' src={tvImage} />
            </div>
            <div className={styles.content_btn__touch} />
            <div className={styles.content_btn}>
              <div className={styles.btn_book__active}>
                <Image layout='fill' src={whitepaperHoverImage} />
              </div>
              <div className={styles.btn_book}>
                <Image layout='fill' src={whitepaperImage} />
              </div>
            </div>
            <div className={styles.content_bush}>
              <Image layout='fill' src={arboresImage} />
            </div>
          </div>
        </slot>
      </div>
    </div>
  )
}

export default Gameplay
