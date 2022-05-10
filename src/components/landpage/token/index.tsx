import React, { useRef } from 'react'

import Image from 'next/image'
import TitleLayer from '@/components/landpage/title-layer'
import AddMetamaskButton from '@/components/landpage/add-metamask-button'

import { useIsVisible } from '@/utils/hooks/is-visible'

import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'

import styles from './styles.module.scss'


const Token: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  const CONTRACT_HASH = '0x3019BF2a2eF8040C242C9a4c5c4BD4C81678b2A1'

  return (
    <section className={styles.container} ref={myRef}>
      <div className={styles.container_content}>
        <div className={styles.content_title}>
          <TitleLayer>Token</TitleLayer>
        </div>

        <div className={styles.content_information}>
          <div className={`
            ${styles.information_text}
            ${isVisible && styles.animation}
          `}>
            <h1 className={styles.text_title}>Phorse Token</h1>

            <ul className={styles.text_description}>
              <li>Symbol: <span>PHORSE</span></li>
              <li>Name: <span>PlanetHorse</span></li>
              <li>Token Supply: <span>1.000.000.000</span></li>
              <li>Chain: <span>Polygon</span></li>
            </ul>
          </div>

          <div className={styles.information_icon}>
            <Image layout='fill' src={phorseToken} alt="Token" />
          </div>
        </div>

        <div className={styles.contract_info}>
          <p>Contract: <span>{CONTRACT_HASH}</span></p>
        </div>

        <AddMetamaskButton className={styles.add_metamask}/>
      </div>
    </section>
  )
}

export default Token
