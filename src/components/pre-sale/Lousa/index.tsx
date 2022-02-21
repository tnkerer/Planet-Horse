import React from 'react'
import styles from './styles.module.scss'
import Chests from '../Chests'
import Percent from '../Percent'

const Lousa: React.FC = () => {
  return (
    <>
    <div className={styles.lousaContainer}>

        <div className={styles.lousaImage}>

            <div className={styles.lousaContent}>

                <div className={styles.lousaTitle}>BLIND CHEST SALE </div>

                <Percent />

                <Chests />

            </div>

        </div>

    </div>
    </>
  )
}

export default Lousa
