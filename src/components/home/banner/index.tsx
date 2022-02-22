import React from 'react'
import styles from './styles.module.scss'
import GraphicalButton from '@/utils/components/graphical-button'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.options}>
        <div className={styles.slot}>
          <GraphicalButton
            to='/animated'
            id={styles.optionButton}
            inactive={styles.inactivePreSale}
            active={styles.activeBauPreSale}
          />
        </div>
        <div className={styles.slot}>
          <GraphicalButton
            to='/animated'
            id={styles.optionButton}
            inactive={styles.inactiveLottery}
            active={styles.activeLottery}
          />
        </div>
      </div>
    </div>
  )
}

export default Banner
