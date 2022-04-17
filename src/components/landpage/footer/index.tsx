import React from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import Link from 'next/link'

import planethorseLogoImage from '@/assets/landpage/planethorse-logo-sem-ferradura.webp'
import horseSpriteImage from '@/assets/landpage/horse-sprite.webp'

const Footer: React.FC = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.container_marketing}>
        <Image
          src={planethorseLogoImage}
          width={292}
          height={118}
        />
        <div className={styles.marketing_community__link}>
          <span>•</span>
          <Link href='#'>COMMUNITY</Link>
          <span>•</span>
        </div>
      </div>
      <div className={styles.container_partner}>
        <span className={styles.partner_title}>PARTNER</span>
        <Image
          src={horseSpriteImage}
          width={204}
          height={210}
        />
        <span className={styles.partner_persons}>SOON</span>
      </div>

      <div className={styles.container_footer}>
        <span className={styles.footer_copyright}>
          COPYRIGHT @ 2022 PLANETHORSE
        </span>
      </div>
    </footer>
  )
}

export default Footer
