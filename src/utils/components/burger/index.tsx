import React from 'react'
import styles from './styles.module.scss'
import Link from 'next/link'

interface Props {
  close?: boolean
}

const Burger: React.FC<Props> = ({ close = false }) => {
  return (
    <div
      id={styles.burger}
      style={{
        left: close ? '0' : '-300px'
      }}
    >
      <Link href='/home'>
        <a>Home</a>
      </Link>
      <Link href='/home'>
        <a>Marketplace</a>
      </Link>
      <Link href='/home'>
        <a>Game</a>
      </Link>
      <Link href='/home'>
        <a>Staking</a>
      </Link>
      <Link href='/home'>
        <a>Barn</a>
      </Link>
    </div>
  )
}

export default Burger
