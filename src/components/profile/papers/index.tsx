import React, { useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import profilePicture from '@/assets/profile/horse.gif'
import depositPhorse from '@/assets/profile/deposit-phorse.png'
import depositPhorseOver from '@/assets/profile/deposit-horse-mouse.gif'
import withdrawHorse from '@/assets/profile/with-horse.png'
import withdrawHorseOver from '@/assets/profile/with-horse-mouse.gif'
import TokenBridge from '@/components/game/Modals/TokenBridge'

const Papers: React.FC = () => {
  const [depositPhorseOver1, setDepositPhorseOver] = useState(false)
  const [withdrawHorseOver1, setWithdrawHorseOver] = useState(false)
  const [showBridge, setShowBridge] = useState(false)

  return (
    <div className={styles.container}>
      {showBridge && <TokenBridge onClose={() => setShowBridge(false)} />}
      <div className={styles.panel}>
        <span className={styles.slot}>
          <span className={styles.profile}>
            <Image
              src='/assets/profile/yellow-paper.webp'
              layout='responsive'
              width={645}
              height={451}
            />
            <span className={styles.cardTitle}>
              profile
            </span>
            <span className={styles.about}>
              <span className={styles.slot}>
                <span className={styles.profilePicture}>
                  <Image
                    src={profilePicture}
                    layout='responsive'
                  />
                </span>
              </span>
              <span className={styles.slot}>
                <span className={styles.phorseCoins}>
                  <span className={styles.icon}>
                    <Image src='/assets/profile/phorse token.svg' width={250} height={250} />
                  </span>
                  <span className={styles.amount}>
                    0 phorse
                  </span>
                </span>
              </span>
            </span>
            <span className={styles.walletAddress}>
              0X268515615489723164987618311
            </span>
          </span>
        </span>
        <span className={styles.slot}>
          <span className={styles.token}>
            <Image
              src='/assets/profile/token-bridge.webp'
              layout='responsive'
              width={590}
              height={444}
            />
            <span
              className={styles.depositPhorse}
              onMouseOver={() => setDepositPhorseOver(true)}
              onMouseLeave={() => setDepositPhorseOver(false)}
              onClick={() => setShowBridge(true)}
            >
              {depositPhorseOver1
                ? <Image
                    src={depositPhorseOver}
                    layout='responsive'
                  />
                : <Image
                    src={depositPhorse}
                    layout='responsive'
                  />}
            </span>
            <span
              className={styles.withdrawPhorse}
              onMouseOver={() => setWithdrawHorseOver(true)}
              onMouseLeave={() => setWithdrawHorseOver(false)}
              onClick={() => setShowBridge(true)}
            >
              {withdrawHorseOver1
                ? <Image
                    src={withdrawHorseOver}
                    layout='responsive'
                  />
                : <Image
                    src={withdrawHorse}
                    layout='responsive'
                  />}
            </span>
          </span>
        </span>
      </div>
    </div>
  )
}

export default Papers
