import React from 'react'
import styles from './styles.module.scss'
import mockChests from '@/utils/mocks/chest'
import SingleChest from '../single-chest'

const Chest: React.FC = () => {
  return (
    <>
      <div className={styles.chestsContainer}>
        <div className={styles.chestsList}>
          {mockChests.map((chest) => (
            <div key={chest.id}>
              <SingleChest chest={chest} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Chest
