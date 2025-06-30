import React, { useRef } from 'react'
import Image from 'next/image'
import TitleLayer from '@/components/landpage/title-layer'
import { useIsVisible } from '@/utils/hooks/is-visible'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import styles from './styles.module.scss'
import { contracts } from '@/utils/constants/contracts'


const Token: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

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
              <li>Token Supply: <span>300.000.000</span></li>
              <li>Chain: <span>Ronin Network</span></li>
            </ul>
          </div>

          <div className={styles.information_icon}>
            <Image layout='fill' src={phorseToken} alt="Token" />
          </div>
        </div>

        <div className={styles.contract_info}>
          <p>Contract: <span>{contracts.phorse}</span></p>
        </div>
      </div>
    </section>
  )
}

export default Token
