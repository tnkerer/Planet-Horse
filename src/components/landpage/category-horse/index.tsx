import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import tape from '@/assets/utils/tape.webp'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

interface Props {
  sticker: StaticImageData
  alt: string
  animationClass?: string
}

const CategoryHorse: React.FC<Props> = ({ sticker, alt, animationClass = '' }) => {
  const { scrollY } = useContext(ScrollYValueContext)
  const [animated, setAnimated] = useState(false)
  const [freezeAnimation, setFreezeAnimation] = useState(false)
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    scrollY >= 3000 && setFreezeAnimation(true)
    const screenWidthResolution = window.innerWidth
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  useEffect(() => {
    animationClass && setAnimated(true)
  }, [animationClass])

  return (
    <div className={`
      ${styles.container}
      ${!freezeAnimation && animationClass}
    `}
    style={{
      opacity: animated || screenWidth <= 810 ? 1 : 0
    }}>
      <div className={styles.tapeContainer}>
        <Image src={tape} alt={alt} />
      </div>
      <Image src={sticker} alt={alt} />
    </div>
  )
}

export default CategoryHorse
