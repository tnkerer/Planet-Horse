import React, { useRef, useState } from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import Link from 'next/link'

import { useIsVisible } from '@/utils/hooks/is-visible'

import tvImage from '@/assets/landpage/tv.webp'
import racingImage from '@/assets/landpage/racing.gif'
import buySell from '@/assets/landpage/buy-sell.gif'
import upgrade from '@/assets/landpage/upgrade.gif'
import noiseTv from '@/assets/landpage/chiado.gif'

import whitepaperImage from '@/assets/landpage/whitepaper.webp'
import whitepaperHoverImage from '@/assets/landpage/whitepaper-mouse.webp'
import arboresImage from '@/assets/landpage/arbores.webp'

const Gameplay: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  const racingText = 'In the Race Mode you can play PvP or PvC. The rewards for the winners will be: experience points, materials, items and tokens.'
  const buySellText = 'teste1'
  const upgradeText = 'teste2'

  const [urlIsVisible, setUrlIsVisible] = useState(racingImage)
  const [textIsVisible, setTextIsVisible] = useState(racingText)

  function changeTvChannel () {
    setUrlIsVisible(noiseTv)
  }

  function handleClickRacing () {
    changeTvChannel()
    setTimeout(() => setUrlIsVisible(racingImage), 500)
    setTextIsVisible(racingText)
  }
  function handleClickUpgrade () {
    changeTvChannel()
    setTimeout(() => setUrlIsVisible(upgrade), 500)
    setTextIsVisible(upgradeText)
  }
  function handleClickBuySell () {
    changeTvChannel()
    setTimeout(() => setUrlIsVisible(buySell), 500)
    setTextIsVisible(buySellText)
  }

  return (
    <div className={styles.container} ref={myRef}>
      <div className={`
        ${styles.container_content}
        ${isVisible && styles.animation}
      `}>
        <slot className={styles.content_gameplay}>
          <div className={styles.gameplay_line__vertical} />
          <div className={styles.gameplay_content}>
            <div className={styles.content_head}>
              <h1 className={styles.head_title}>GAMEPLAY</h1>

              <u className={styles.head_option} onClick={handleClickRacing}>RACING</u>
              <u className={styles.head_option} onClick={handleClickBuySell}>BUY / SELL</u>
              <u className={styles.head_option} onClick={handleClickUpgrade}>UPGRADE</u>
            </div>
            <div className={styles.gameplay_body}>
              <span className={styles.gameplay_description__paragraph1}>
                {textIsVisible}
              </span>
            </div>
          </div>
        </slot>
        <slot className={styles.content_horses}>
          <div className={styles.horses_content}>
            <div className={styles.content_viewfinder}>
              <Image layout='fill' src={urlIsVisible} />
            </div>
            <div className={styles.content_tv}>
              <Image layout='fill' src={tvImage} />
            </div>
            <div className={styles.content_btn__touch}>
              <Link href='https://whitepaper.planethorse.me/'>
                <a target='_blank' />
              </Link>
            </div>
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
