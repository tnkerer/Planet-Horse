import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'

interface Props {
  imageFront: StaticImageData
  imageBack: StaticImageData
  name: string
  position: string
  to: string
}

const TeamCard: React.FC<Props> = ({
  imageFront,
  imageBack,
  name,
  position,
  to
}) => {
  return (
    <div className={styles.container} onClick={() => {
      window.open(to, '_blank')
    }}>
      <div className={styles.card}>
        <div className={styles.flipCard}>
          <div className={styles.flipCardInner}>
            <div className={styles.flipFront}>
              <Image layout='fill' src={imageFront} />
            </div>
            <div className={styles.flipBack}>
              <Image layout='fill' src={imageBack} />
            </div>
          </div>
        </div>
        <span className={styles.name}>{name}</span>
        <span className={styles.position}>{position}</span>
      </div>
    </div>
  )
}

export default TeamCard
