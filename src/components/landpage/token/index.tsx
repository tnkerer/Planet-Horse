import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'

import TitleLayer from '@/components/landpage/title-layer'
import LogoImage from '@/assets/utils/logos/animted-phorse-coin.gif'

import Image from 'next/image'

const Token: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.container_header} />

      <div className={styles.container_content}>
        <div className={styles.content_title}>
          <TitleLayer>
            Token
          </TitleLayer>
        </div>
        <div className={styles.content_information}>
          <div className={styles.information_text}>
            <div className={styles.text_title}>
              <u>PHORSE TOKEN</u> 
            </div>
            <div className={styles.text_description}>
              Symbol: PHORSE<br />
              Name: PlanetHorse<br />
              Token Max Supply: 1.000.000.000<br />
              Chain: Matic<br />
              Contract: Coming Soon
            </div>
          </div>
          <div className={styles.information_icon}>
            <div className={styles.icon_container}>
              <Image src={LogoImage} layout='fill' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Token
