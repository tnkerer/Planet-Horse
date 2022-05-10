import React, { useRef } from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import horseSpriteImage from '@/assets/landpage/horse-sprite.webp'
import metamathLogo from '@/assets/landpage/metamath-logo.png'

import TitleLayer from '../title-layer'

import { useIsVisible } from '@/utils/hooks/is-visible'

const Team: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  return (
    <section className={styles.container} ref={myRef}>
      <div className={styles.content}>
        <TitleLayer>Partners</TitleLayer>

        <div className={styles.partners}>
          <div>
            <Image src={horseSpriteImage} alt="Horse"/>
          </div>
          <strong className={styles.partner_persons}>SOON</strong>
        </div>
        
        <div className={styles.developer_title}>
          <strong>DEVELOPED BY</strong>

          <div className={styles.metamath_logo}>
            <Image src={metamathLogo} alt="MetaMatch&trade;"/>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Team
