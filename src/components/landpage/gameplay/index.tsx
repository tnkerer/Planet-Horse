import React, { useRef, useState } from 'react'

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

import styles from './styles.module.scss'


const CHANNELS = {
  racing: {
    title: 'Racing',
    content: `In the Race Mode you can play PvP or PvC.
      The rewards for the winners will be: experience points, materials, items and tokens.`,
    image: racingImage,
  },
  buy_sell: {
    title: 'Buy/Sell',
    content: `In the market, players can buy/sell horses, materials, items and stables.
      Players will spend/earn PlanetHorse token when trading on the market.`,
    image: buySell,
  },
  upgrade: {
    title: 'Upgrade',
    content: `You can pay in PHORSE currency to upgrade your horse.
      Increase your win rates and earn more. Horse upgrade increases speed, sprint, support and power.`,
    image: upgrade,
  },
}

type Channel = keyof typeof CHANNELS

const GamePlay: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  const [urlIsVisible, setUrlIsVisible] = useState(CHANNELS.racing.image)
  const [textIsVisible, setTextIsVisible] = useState(CHANNELS.racing.content)

  function changeTvChannel (toChannel: Channel) {
    const channel = CHANNELS[toChannel];

    setUrlIsVisible(noiseTv)
    setTextIsVisible(channel.content)
    setTimeout(() => setUrlIsVisible(channel.image), 500)
  }

  return (
    <section className={styles.container} ref={myRef}>
      <div className={`${styles.container_content} ${isVisible && styles.animation}`}>
        <div className={styles.content_gameplay}>
          <div>
            <header className={styles.content_head}>
              <h1>Game Play</h1>
            </header>

            <ul className={styles.gameplay_topics}>
              {Object.entries(CHANNELS).map(([key , channel]) => (
                <li
                  key={key}
                  about={channel.title}
                  className={styles.toggle}
                  onClick={() => changeTvChannel(key as Channel)}
                >
                  <u>{channel.title}</u>
                </li>
              ))}
            </ul>

            <div className={styles.gameplay_body}>
              <p>{textIsVisible}</p>
            </div>
          </div>
        </div>
        
        <div className={styles.content_horses}>
          <div className={styles.horses_content}>

            <div className={styles.content_viewfinder}>
              <Image layout='fill' src={urlIsVisible} />
            </div>

            <div className={styles.content_tv}>
              <Image layout='fill' src={tvImage} />
            </div>

            <div className={styles.link}>
              <Link href='https://whitepaper.planethorse.me/'>
                <a target='_blank' />
              </Link>
            </div>

            <div className={styles.book_container}>
              <Image layout='fill' src={whitepaperImage} className={styles.book} />
              <Image layout='fill' src={whitepaperHoverImage} className={styles.book_hover} />
            </div>

            
            <div className={styles.content_bush}>
              <Image src={arboresImage} layout='fill' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GamePlay
