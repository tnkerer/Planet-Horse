import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'

interface Props {
  image: StaticImageData
  name: string
  position: string
}

const TeamCard: React.FC<Props> = ({ image, name, position }) => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.sticker}>
          <Image src={image} />
        </div>
        <span className={styles.name}>{name}</span>
        <span className={styles.position}>{position}</span>
      </div>
    </div>
  )
}

export default TeamCard
