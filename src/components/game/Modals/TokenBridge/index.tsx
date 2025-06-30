import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'

import closeIcon from '@/assets/game/pop-up/fechar.png'

import { useUser } from '@/contexts/UserContext'
import { useWallet } from '@/contexts/WalletContext'

import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers'

import { contracts, wallets } from '@/utils/constants/contracts'

import ConfirmModal from '../ConfirmModal'
import ErrorModal from '../ErrorModal'
import InfoModal from '../InfoModal'

// Minimal ERC20 ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]

interface TokenBridgeProps {
  onClose: () => void
}

const TokenBridge: React.FC<TokenBridgeProps> = ({ onClose }) => {
  const { phorse, updateBalance } = useUser()
  const { address, connect } = useWallet()

  const [walletBalance, setWalletBalance] = useState<string>('0')

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState<React.ReactNode>('')
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(
    async () => { }
  )

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // 🔥 Provider helper
  const getRoninProvider = () => {
    const ronin = (window as any).ronin
    if (!ronin?.provider) {
      throw new Error('Ronin wallet not detected. Please install and connect your Ronin wallet.')
    }
    return new BrowserProvider(ronin.provider)
  }

  // Fetch wallet PHORSE balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      if (!address) {
        setWalletBalance('0')
        return
      }

      const provider = getRoninProvider()
      const signer = await provider.getSigner()

      const tokenContract = new Contract(contracts.phorse, ERC20_ABI, signer)

      const rawBalance = await tokenContract.balanceOf(address)
      const formatted = formatUnits(rawBalance, 18)

      setWalletBalance(formatted)
    } catch (err) {
      console.error('Failed to fetch wallet balance', err)
      setWalletBalance('0')
    }
  }, [address])

  useEffect(() => {
    fetchWalletBalance()
  }, [address, fetchWalletBalance])

  const handleMaxDeposit = () => {
    setDepositAmount(walletBalance.toString())
  }

  const handleMaxWithdraw = () => {
    setWithdrawAmount(phorse?.toString() ?? '0')
  }

  // Deposit Handler (ERC20 Transfer)
  const openDepositConfirm = () => {
    const amount = Number(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero.')
      return
    }

    setConfirmText(
      <>
        Do you wish to deposit {amount} PHORSE to the game (
        <span style={{ color: '#E21C21' }}>
          this will require signing an onchain token transfer
        </span>
        )?
      </>
    )

    setConfirmAction(() => async () => {
      try {
        if (!address) {
          await connect()
        }

        const provider = getRoninProvider()
        const signer = await provider.getSigner()

        const tokenContract = new Contract(contracts.phorse, ERC20_ABI, signer)

        const value = parseUnits(depositAmount, 18)

        const tx = await tokenContract.transfer(wallets.treasury, value)
        console.log('Transaction submitted:', tx)

        const receipt = await tx.wait()
        console.log('Transaction confirmed:', receipt)

        setInfoMessage(
          `Deposit successful. This might take a few minutes to reflect ingame. Check your Profile page for confirmation.`
        )

        updateBalance()
        setDepositAmount('')
        await fetchWalletBalance()
      } catch (err: any) {
        console.error(err)
        const msg =
          err?.info?.error?.message ||
          err?.error?.message ||
          err?.message ||
          'An error occurred during the deposit transaction.'
        setErrorMessage(msg)
      }
    })

    setShowConfirm(true)
  }

  // Withdraw Handler (API-based)
  async function fetchWithdrawTax(): Promise<{ taxPct: number }> {
    const res = await fetch(`${process.env.API_URL}/user/withdraw-tax`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch tax (${res.status})`)
    }
    return res.json()
  }

  const openWithdrawConfirm = async () => {
    const amount = Number(withdrawAmount)
    if (isNaN(amount) || amount <= 999) {
      setErrorMessage('Please enter a valid amount greater than 999.')
      return
    }

    try {
      const { taxPct } = await fetchWithdrawTax()

      setConfirmText(
        <>
          Do you wish to withdraw {amount} PHORSE from the game (
          <span style={{ color: '#E21C21' }}>paying a {taxPct}% tax</span>)?
        </>
      )

      setConfirmAction(() => async () => {
        try {
          const res = await fetch(`${process.env.API_URL}/user/withdraw`, {
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
            } catch { }
            throw new Error(msg)
          }

          const { transactionId } = await res.json()

          setInfoMessage(
            `Withdrawal initiated. This might take a few minutes. Check your Profile page for more info.`
          )

          updateBalance()
          setWithdrawAmount('')
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to withdraw')
        }
      })

      setShowConfirm(true)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Could not calculate withdraw tax')
    }
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    await confirmAction()
  }

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          text={confirmText}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}

      {errorMessage && (
        <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {infoMessage && (
        <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />
      )}

      <div className={styles.overlay}>
        <div className={styles.modal}>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          <div className={styles.title}>TOKEN BRIDGE</div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <input
                className={styles.input}
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
              />
              <button
                className={styles.maxBtn}
                onClick={handleMaxDeposit}
                type="button"
              >
                max
              </button>
              <div className={styles.available}>
                Available: {Number(walletBalance).toFixed(2)}
              </div>
            </div>
            <button
              className={`${styles.bridgeBtn} ${styles.depositBtn}`}
              onClick={openDepositConfirm}
              type="button"
            >
              DEPOSIT
            </button>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <input
                className={styles.input}
                type="text"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="1000"
              />
              <button
                className={styles.maxBtn}
                onClick={handleMaxWithdraw}
                type="button"
              >
                max
              </button>
              <div className={styles.available}>
                Available: {phorse?.toFixed(0) ?? 0}
                <br />Min. Withdraw:
                <span style={{ color: '#E21C21' }}>
                  1000
                </span>
              </div>
            </div>
            <button
              className={`${styles.bridgeBtn} ${styles.withdrawBtn}`}
              onClick={openWithdrawConfirm}
              type="button"
            >
              WITHDRAW
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default TokenBridge
