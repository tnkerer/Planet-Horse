import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  copyrightTextColor: string
}

const Footer: React.FC<Props> = ({ copyrightTextColor }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Image
            src='/assets/utils/logos/planet-horse.webp'
            width={136}
            height={55}
          />
        </div>
        <div className={styles.socials}>
          <div className={styles.slot}>
          <Link href={'https://discord.com/invite/ronen'}>
          <a target="_blank" rel="noreferrer">
            <Image
              src='/assets/icons/socials/discord.webp'
              width={40}
              height={40}
            />
            </a>
            </Link>
          </div>
          <div className={styles.slot}>
          <Link href={'https://twitter.com/'}>
          <a target="_blank" rel="noreferrer">
            <Image
              src='/assets/icons/socials/twitter.webp'
              width={40}
              height={40}
            />
            </a>
            </Link>
          </div>
          {/* <div className={styles.slot}>
            <Image
              src={'/assets/icons/socials/telegram.webp'}
              width={40}
              height={40}
            />
          </div>
          <div className={styles.slot}>
            <Image
              src='/assets/icons/socials/instagram.webp'
              width={40}
              height={40}
            />
          </div> */}
        </div>
        <span
          style={{
            color: copyrightTextColor
          }}
        >
          Copyright © 2025 planethorse
        </span>
      </div>
    </div>
  )
}

export default Footer
