import React from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/utils/logos/planet-horse.webp'
import Image from 'next/image'
import Link from 'next/link'
import Board from '../board'
import Frame from '@/utils/components/frame'

const Blackboard: React.FC = () => {
  return (
    <div className={styles.container}>
      <Frame />
      <h2>OUR BRACKERS</h2>
      <div className={styles.planethorse} />
      <h1>SOON</h1>
      <div className={styles.logo}>
        <Image
          width={140}
          height={50}
          src={logo}
        />
      </div>
      <div className={styles.communityLink}>
        <span>•</span>
          <Link href="https://whitepaper.planethorse.me/portuguese-version-1.0/social">
            <a>
              Community
            </a>
          </Link>
        <span>•</span>
      </div>
      <div className={styles.copyright}>
        <span>Copyright © 2022 planethorse</span>
      </div>
    </div>
  )
}

export default Blackboard
