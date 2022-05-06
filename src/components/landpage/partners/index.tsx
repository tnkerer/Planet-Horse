import React, { useRef } from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import horseSpriteImage from '@/assets/landpage/horse-sprite.webp'
import metamathLogo from '@/assets/landpage/metamath-logo.png'

import TitleLayer from '../title-layer'

const Team: React.FC = () => {
  const myRef = useRef()

  return (
    <div className={styles.container} ref={myRef}>
      <div className={styles.container_header} />
      <div className={styles.container_team}>
        <div className={styles.partners_title}>
          <TitleLayer>
            Partners
          </TitleLayer>
        </div>
        <div className={styles.partners}>
          <Image
            src={horseSpriteImage}
            width={134}
            height={144}
          />
          <div className={styles.partner_persons}>SOON</div>
        </div>
        <div className={styles.developer_title}>
          <p>DEVELOPED BY</p>
        </div>
        <div className={styles.metamath_logo}>
          <Image
            src={metamathLogo}
            width={500}
            height={120}
           />
        </div>
  )
}

export default Team
