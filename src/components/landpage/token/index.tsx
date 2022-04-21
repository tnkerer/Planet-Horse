import React, { useRef, useState, useEffect } from 'react'
import styles from './styles.module.scss'

import TitleLayer from '@/components/landpage/title-layer'

const Token: React.FC = () => {
  const myRef = useRef()
  const [IsVisble, setIsVisble] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0]
      setIsVisble(entry.isIntersecting)
    }) 
    observer.observe(myRef.current)
  }, [])

  return (
    <div className={styles.container} ref={myRef}>
      <div className={styles.container_header} />

      <div className={styles.container_content}>
        <div className={styles.content_title}>
          <TitleLayer>
            Token
          </TitleLayer>
        </div>
        <div className={styles.content_information}>
          <div className={`
            ${styles.information_text}
            ${IsVisble ? styles.animation : ''}
          `}>
            <div className={styles.text_title}>
              <u>PHORSE TOKEN</u>
            </div>
            <div className={styles.text_description}>
              Symbol: PHORSE<br />
              Name: PlanetHorse<br />
              Token Max Supply: 1.000.000.000<br />
              Chain: Matic<br />
              Contract: Coming Soon
            </div>
          </div>
          <div className={styles.information_icon}>
            <div className={styles.icon_container} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Token
