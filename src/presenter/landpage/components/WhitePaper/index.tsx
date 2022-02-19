import React, { useState } from 'react'
import styles from './styles.module.scss'

const WhitePaper: React.FC = () => {
  const [activeBtnState, setActiveBtnState] = useState(false)

  return (
    <div className={styles.container}>
      <div
        className={styles.slot}
      >
        <button
          className={styles.inactive}
          onMouseEnter={() => {
            setActiveBtnState(true)
          }}
        />
        <button
          className={styles.active}
          onMouseLeave={() => {
            setActiveBtnState(false)
          }}
          style={activeBtnState
            ? { display: 'flex' }
            : { display: 'none' }}
        />
      </div>
    </div>
  )
}

export default WhitePaper
