import AnimatedButton from '@/presenter/utils/globals/factories/animatedButton'
import React from 'react'
import styles from './styles.module.scss'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.options}>
        <div className={styles.slot}>
          <AnimatedButton
            to='/animated'
            id={styles.optionButton}
            inactive={styles.inactivePreSale}
            active={styles.activeBauPreSale}
          />
        </div>
        <div className={styles.slot}>
          <AnimatedButton
            to='/animated'
            id={styles.optionButton}
            inactive={styles.inactiveLottery}
            active={styles.activeBauPreSale}
          />
        </div>
      </div>
    </div>
  )
}

export default Banner
