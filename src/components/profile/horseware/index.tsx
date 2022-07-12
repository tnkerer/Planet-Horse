import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import logoHorseware from '@/assets/profile/logo-horseware.png'
import tapeGraph from '@/assets/utils/tape.webp'
import keyboard from '@/assets/profile/keyboard.gif'
import lightOff from '@/assets/profile/light-off.webp'
import lightOn from '@/assets/profile/light-on.webp'

const Horseware = () => {
  const [light, setLight] = useState(false)

  useEffect(() => {
    function interval () {
      const min = 1
      const max = 5
      const rand = Math.floor(Math.random() * (max - min + 1) + min)
      setLight(!light)
      setTimeout(interval, rand * 1000)
    }
    interval()
  }, [])

  useEffect(() => {
    console.log(light)
  }, [light])

  return (
    <div className={styles.container}>
      <div className={styles.screen}>
        <svg width='100%' height='130'>
          <rect y='116' fill='#252425' width='100%' height='14' />
          <circle cx="50%" cy="60px" r="45" fill='#252425' />
        </svg>
        <div className={styles.tape}>
          <Image
            src={tapeGraph}
            width={205}
            height={62}
          />
        </div>
        <div className={styles.transation}>
          <div className={styles.tableContainer}>
            <span className={styles.tableTitle}>transactions</span>
            <div className={styles.columns}>
              <span>
                <span>type</span>
              </span>
              <span>
                <span>status</span>
              </span>
              <span>
                <span>value</span>
              </span>
              <span>
                <span>note</span>
              </span>
              <span>
                <span>data</span>
              </span>
              <span>
                <span>view</span>
              </span>
            </div>
            <table>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
              <tr>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
                <td>value</td>
              </tr>
            </table>
          </div>
        </div>
        <svg width='100%' height='130'>
          <rect fill='#252425' width='100%' height='14' />
        </svg>
        <div className={styles.shadow} />
        <div className={styles.logo}>
          <Image
            src={logoHorseware}
            width={600}
            height={80}
          />
        </div>
      </div>
      <div className={styles.table}>
        <svg width='700' height='300'>
          <rect fill='#252425' x='4' y='264' width='692' height='4' />
          <rect fill='#252425' x='0' y='250' width='700' height='14' />
          <rect fill='#323132' x='4' y='176' width='692' height='6' />
          <rect fill='#323132' x='0' y='180' width='700' height='70' />
          <rect fill='#323132' x='4' y='250' width='692' height='4' />
          <rect fill='#252425' x='220' width='260' height='228' />
          <rect fill='#252425' x='220' y='228' width='253' height='6' />
        </svg>
        <span className={styles.light}>
          <Image
            src={light ? lightOff : lightOn}
            layout='responsive'
          />
        </span>
        <div className={styles.clarity}>
          <span>
            <Image
              src={keyboard}
              width={805}
              height={240}
            />
          </span>
        </div>
        <div className={styles.shadow} />
      </div>
    </div>
  )
}

export default Horseware
