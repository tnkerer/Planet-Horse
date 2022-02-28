import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'
import Image from 'next/image'
import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'

interface Props {
  image: StaticImageData
  reverse?: boolean
  scrollValueToAnimate?: number
  infoFirstParagraph: string
  infoSecondParagraph: string
}

const Card: React.FC<Props> = ({
  image,
  reverse = false,
  scrollValueToAnimate = 0,
  infoFirstParagraph,
  infoSecondParagraph
}) => {
  const [scrolled, setScrolled] = useState(false)
  const [screenWidth, setScreenWidth] = useState(0)
  const { scrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    const elementAppearsToUser = scrollY >= scrollValueToAnimate
    const screenWidthResolution = window.innerWidth
    elementAppearsToUser && setScrolled(true)
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  return (
    <div
      className={`
        ${reverse
          ? styles.containerReverse
          : styles.containerNoReverse}
        ${scrolled && styles.animation}
      `}
      style={{
        opacity: scrolled || screenWidth <= 810 ? 1 : 0
      }}
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
