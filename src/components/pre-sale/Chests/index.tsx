import React from 'react'
import styles from './styles.module.scss'
import mockChests from '../../../data/mock/chest'
import SingleChest from '../SingleChest'

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
