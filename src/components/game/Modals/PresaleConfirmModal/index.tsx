// PresaleConfirmModal.tsx

import React, { useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import closeIcon from '@/assets/game/pop-up/fechar.png'

import { BrowserProvider, parseUnits } from 'ethers'
import { useWallet } from '@/contexts/WalletContext'
import { wallets } from '@/utils/constants/contracts'

import ErrorModal from '../ErrorModal'
import InfoModal from '../InfoModal'

interface Props {
  max: number
  price: number
  quantity: number
  onClose: () => void
}

const BRIDGE_ADDRESS = wallets.treasury // TODO: Replace with actual bridge address

const PresaleConfirmModal: React.FC<Props> = ({ max, price, quantity, onClose }) => {
  const { address, connect } = useWallet()
  const [amount, setAmount] = useState<number>(price * quantity)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const handleYes = async () => {

    try {
      if (!address) await connect()

      // Step 1: Call presale-intent endpoint
      const res = await fetch(`${process.env.API_URL}/user/presale-intent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const errJson = await res.json()
          if (errJson?.message) msg = errJson.message
        } catch {}
        throw new Error(msg)
      }

      // Step 2: Show wallet confirmation modal
      setInfoMessage('Please confirm on your wallet to finalize the purchase...')

      // Step 3: Initiate native RON transfer
      const ronin = (window as any).ronin
      if (!ronin?.provider) throw new Error('Ronin wallet not detected')

      const provider = new BrowserProvider(ronin.provider)
      const signer = await provider.getSigner()

      const ronAmount = 0.0016 * amount
      const value = parseUnits(ronAmount.toString(), 18)

      const tx = await signer.sendTransaction({
        to: BRIDGE_ADDRESS,
        value,
      })

      await tx.wait()

      // Step 4: Final confirmation
      setInfoMessage('Transaction finalized in the blockchain, it will reflect soon on your ingame balance!')
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.info?.error?.message ||
        err?.error?.message ||
        err?.message ||
        'An error occurred during the transaction.'
      setErrorMessage(msg)
    }
  }

  return (
    <>
      {errorMessage && (
        <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {infoMessage && (
        <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />
      )}

      <div className={styles.overlay}>
        <div className={styles.modal}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          <div className={styles.text}>
            Do you want to buy <b>{quantity}</b> PHORSE for <b>{amount}</b> PHORSE tokens?
          </div>

          <div className={styles.sliderContainer}>
            <input
              type="range"
              min={price}
              max={max}
              step={price}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <div className={styles.sliderValue}>{amount}</div>
          </div>

          <div className={styles.buttons}>
            <button className={styles.yesBtn} onClick={handleYes}></button>
            <button className={styles.noBtn} onClick={onClose}></button>
          </div>
        </div>
      </div>
    </>
  )
}

export default PresaleConfirmModal
