import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import logoHorseware from '@/assets/profile/logo-horseware.png'
import keyboard from '@/assets/profile/keyboard.gif'
import { useWallet } from '@/contexts/WalletContext'

type Tx = {
  type: string;
  status: string;
  value: number;
  txId: string | null;
  note: string | null;
  createdAt: string;
};

const Horseware: React.FC = () => {
  const [light, setLight] = useState(false)
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthorized, address } = useWallet();

  useEffect(() => {
    function interval() {
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

  // fetch transaction history
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.API_URL}/user/transactions`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Tx[]>;
      })
      .then(data => setTxs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthorized, address]);

  useEffect(() => {
    if (!address) {
      setTxs([])
    }
  }, [isAuthorized, address]) 

  return (
    <div className={styles.container}>
      <div className={styles.screen}>
        <svg width='100%' height='130'>
          <rect y='116' fill='#252425' width='100%' height='14' />
          <circle cx="50%" cy="60px" r="45" fill='#252425' />
        </svg>
        <div className={styles.tape}>
          <Image
            src='/assets/utils/tape.webp'
            width={205}
            height={62}
          />
        </div>
        <div className={styles.transation}>
          <div className={styles.tableContainer}>
            <span className={styles.tableTitle}>transactions</span>
            <div className={styles.columns}>
              {['type', 'status', 'value', 'note', 'date', 'view'].map(col => (
                <span key={col}><span>{col}</span></span>
              ))}
            </div>
            <table>
              {loading ? (
                <tr><td colSpan={6}>Loading…</td></tr>
              ) : txs.length === 0 ? (
                <tr><td colSpan={6}>No transactions yet</td></tr>
              ) : (
                txs.slice( 0 , 99 ).map((tx, i) => (
                  <tr key={i}>
                    <td>{tx.type}</td>
                    <td>{tx.status}</td>
                    <td>{tx.value}</td>
                    <td>{tx.note ?? 'No note'}</td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.txId ? (<a target="_blank" rel="noreferrer" href={`https://saigon-app.roninchain.com/tx/${tx.txId}`}>View</a>) : 'internal'}</td>
                  </tr>
                ))
              )}
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
            src={light ? '/assets/profile/light-off.webp' : '/assets/profile/light-on.webp'}
            layout='responsive'
            width={132}
            height={40}
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
