import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import { FlipperContext } from '@/utils/providers/flipper'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

interface Props {
  imageFront: StaticImageData
  imageBack: StaticImageData
  avatarName: string
  realName: string
  position: string
  index: number,
  to: string
}

const TeamCard: React.FC<Props> = ({
  imageFront,
  imageBack,
  avatarName,
  realName,
  position,
  index,
  to
}) => {
  const { flipper, setFlipper } = useContext(FlipperContext)
  const { scrollY } = useContext(ScrollYValueContext)
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const screenWidthResolution = window.innerWidth
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  const change = () => {
    let changer = [...flipper]
    changer[index] = !changer[index]
    setFlipper(changer)
  }

  return (
    <div className={styles.container}>
      <div className={styles.flipCard}>
        {screenWidth <= 1100 && <button onClick={change} />}
        <div
          className={styles.flipCardInner}
          style={screenWidth <= 1100 ? {
            transform: flipper[index] ? 'rotateY(180deg)' : 'rotateY(0deg)',
          } : {}}
          onClick={() => {
            window.open(to, '_blank')
          }}>
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
