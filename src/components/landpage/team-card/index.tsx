import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'

interface Props {
  imageFront: StaticImageData
  imageBack: StaticImageData
  avatarName: string
  realName: string
  position: string
  to: string
}

const TeamCard: React.FC<Props> = ({
  imageFront,
  imageBack,
  avatarName,
  realName,
  position,
  to
}) => {
  return (
    <div className={styles.container} onClick={() => {
      window.open(to, '_blank')
    }}>
      <div className={styles.flipCard}>
        <div className={styles.flipCardInner}>
          <div className={styles.flipCardFront}>
            <span className={styles.image}>
              <Image layout='fill' src={imageFront} />
            </span>
            <span className={styles.name}>
              {avatarName}
            </span>
            <span className={styles.position}>
              {position}
            </span>
          </div>
          <div className={styles.flipCardBack}>
            <span className={styles.image}>
              <Image layout='fill' src={imageBack} />
            </span>
            <span className={styles.name}>
              {realName}
            </span>
            <span className={styles.position}>
              {position}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamCard
