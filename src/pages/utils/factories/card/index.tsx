
import Image from 'next/image'
import React from 'react'
import styles from './styles.module.scss'

interface Props {
  image: StaticImageData
  reverse?: boolean
  infoFirstParagraph: string
  infoSecondParagraph: string
}

const Card: React.FC<Props> = ({ image, reverse = false, infoFirstParagraph, infoSecondParagraph }) => {
  return (
    <div
      className={reverse ? styles.containerReverse : styles.containerNoReverse }
    >
      <div className={styles.imgContainer}>
        <Image
          src={image}
          alt='corrida de demonstracao'
        />
      </div>
      <div className={styles.infoContainer}>
        <h4>
          {infoFirstParagraph}<br /><br />
          {infoSecondParagraph}
        </h4>
      </div>
    </div>
  )
}

export default Card
