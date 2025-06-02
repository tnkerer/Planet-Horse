import React from 'react'

import Link from 'next/link'
import Image from 'next/image'

import styles from './styles.module.scss'

const socialMediaIcons = {
  discord: '/assets/icons/socials/discord.webp',
  telegram: '/assets/icons/socials/telegram.webp',
  instagram: '/assets/icons/socials/instagram.webp',
  twitter: '/assets/icons/socials/twitter.webp',
}

type SocialMediaType = keyof typeof socialMediaIcons;

const Footer: React.FC = () => {
  const socialMediaLinks = {
    discord: 'https://discord.gg/dTcrcUHczS',
    twitter: 'https://x.com/PlanetHorseGame',
  }

  const renderSocialMediaElements = () =>
    Object.entries(socialMediaLinks).map(([social, link]) => (
      <li  key={`key-${social}`}>
        <Link href={link}>
          <a target="_blank" rel="noreferrer">
            <Image
              layout="fill"
              alt={`${social.toUpperCase()} Planet Horse`}
              src={socialMediaIcons[social as SocialMediaType]}
            />
          </a>
        </Link>
      </li>
    )
  )

  return (
    <footer className={styles.container}>
      <div className={styles.container_mid}>
        <div className={styles.container_marketing}>
          <strong className={styles.marketing_community}>
            Join our community
          </strong>

          <ul className={styles.social_media}>
            {renderSocialMediaElements()}
          </ul>
        </div>

        <div className={styles.container_footer}>
          <span className={styles.footer_copyright}>
            Copyright © 2025 PlanetHorse
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
