import React, { useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { useIsVisible } from '@/utils/hooks/is-visible'

import racingImage from '@/assets/landpage/racing.gif'
import buySell from '@/assets/landpage/buy-sell.gif'
import upgrade from '@/assets/landpage/upgrade.gif'
import noiseTv from '@/assets/landpage/chiado.gif'

import whitepaperImage from '@/assets/landpage/whitepaper.webp'
import whitepaperHoverImage from '@/assets/landpage/whitepaper-mouse.webp'

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

type Channel = typeof CHANNELS.racing
type ChannelName = keyof typeof CHANNELS

const GamePlay: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  const [currentChanel, setCurrentChannel] = useState<Channel>({...CHANNELS.racing})

  function changeTvChannel (toChannel: ChannelName) {
    const { title, content, image  } = CHANNELS[toChannel];

    setCurrentChannel({ title, content, image: noiseTv })
    setTimeout(() => setCurrentChannel(state => ({ ...state, image })), 500)
  }

  return (
    <section className={styles.container} ref={myRef}>
      <div className={`${styles.container_content} ${isVisible && styles.animation}`}>
        <div className={styles.content_gameplay}>
          <div>
            <header className={styles.content_head}>
              <h1>GamePlay</h1>
            </header>

            <ul className={styles.gameplay_topics}>
              {Object.entries(CHANNELS).map(([key , channel]) => (
                <li key={key} about={channel.title} className={styles.toggle}>
                  <button onClick={() => changeTvChannel(key as ChannelName)}>
                    {channel.title}
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.gameplay_body}>
              <p>{currentChanel.content}</p>
            </div>
          </div>
        </div>
        
        <div className={styles.content_horses}>
          <div className={styles.horses_content}>

            <div className={styles.content_viewfinder}>
              <Image layout='fill' src={currentChanel.image} alt={currentChanel.title}/>
            </div>

            <div className={styles.content_tv}>
              <Image layout='fill' src='/assets/landpage/tv.webp' alt="Tv"/>
            </div>

            <div className={styles.link}>
              <Link href='https://whitepaper.planethorse.me/'>
                <a target='_blank' />
              </Link>
            </div>

            <div className={styles.book_container}>
              <Image layout='fill' src='/assets/landpage/whitepaper.webp' className={styles.book} alt="Whitepaper PlanetHorse"/>
              <Image layout='fill' src='/assets/landpage/whitepaper-mouse.webp' className={styles.book_hover} alt="Whitepaper PlanetHorse"/>
            </div>
            
            <div className={styles.content_bush}>
              <Image src='/assets/landpage/arbores.webp' layout='fill'/>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GamePlay
