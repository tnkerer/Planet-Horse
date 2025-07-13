import React, { useEffect, useRef, useState } from 'react'

import Image, { ImageProps } from 'next/image'

import { useIsVisible } from '@/utils/hooks/is-visible'

import styles from './styles.module.scss'

type Props = {
  title: string;
  value?: number;
  icon: ImageProps['src'];
  animate: boolean;
}

const Card: React.FC<Props> = ({ title, value = 20000, icon, animate }) => {
  const [ascendingNumber, setAscendingNumber] = useState(0)

  useEffect(() => {
    if (animate) {
      let i = 0

      const ascender = setInterval(() => {
        (i === value) && clearInterval(ascender)
        setAscendingNumber(i)
        i = + i + 25
      }, 2)
    }
  }, [animate])

  return (
    <div className={styles.cards_card}>
      <span className={styles.card_image}>
        <Image layout='fill' src={icon} />
      </span>
      <span className={styles.card_title}>{title}</span>
      <span className={styles.card_value}>
        {ascendingNumber}
        {/* {ascendingNumber !== value ? ascendingNumber : 'Soon'} */}
      </span>
    </div>
  )
}

export default Card
