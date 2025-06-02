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
      <Link href='/'>
        <a>Home</a>
      </Link>
      <Link href='/game'>
        <a>Game</a>
      </Link>
      <Link href='/profile'>
        <a>Profile</a>
      </Link>
      <Link href='https://opensea.io/'>
        <a target="_blank">Marketplace</a>
      </Link>
    </div>
  )
}

export default Burger
