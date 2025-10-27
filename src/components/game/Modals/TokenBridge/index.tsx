import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'

import closeIcon from '@/assets/game/pop-up/fechar.png'
import phorseToken from '@/assets/icons/coin.gif'
import wronIcon from '@/assets/icons/wron.gif'

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

type TokenSymbol = 'PHORSE' | 'WRON'

interface TokenBridgeProps {
  onClose: () => void
}

const LIMITS: Record<TokenSymbol, { min: number; max: number; withdrawPlaceholder: string }> = {
  PHORSE: { min: 1000, max: 100000, withdrawPlaceholder: '1000' },
  WRON: { min: 0.01, max: 10000, withdrawPlaceholder: '0.01' },
}

const TokenBridge: React.FC<TokenBridgeProps> = ({ onClose }) => {
  // ⬇️ assumes your UserContext exposes both phorse and wron balances (game-side)
  const { phorse, wron, updateBalance } = useUser() as any
  const { address, connect } = useWallet()

  // 🔀 new: selected token
  const [token, setToken] = useState<TokenSymbol>('WRON')

  // wallet balance for the selected token
  const [walletBalance, setWalletBalance] = useState<string>('0')

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState<React.ReactNode>('')
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(async () => { })

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

  const selectedContractsAddress = token === 'PHORSE' ? contracts.phorse : contracts.wron
  const gameAvailable = token === 'PHORSE' ? (phorse ?? 0) : (wron ?? 0)
  const { min, max, withdrawPlaceholder } = LIMITS[token]

  // Fetch wallet token balance for the selected token
  const fetchWalletBalance = useCallback(async () => {
    try {
      if (!address) {
        setWalletBalance('0')
        return
      }
      const provider = getRoninProvider()
      const signer = await provider.getSigner()
      const tokenContract = new Contract(selectedContractsAddress, ERC20_ABI, signer)
      const rawBalance = await tokenContract.balanceOf(address)
      const formatted = formatUnits(rawBalance, 18)
      setWalletBalance(formatted)
    } catch (err) {
      console.error('Failed to fetch wallet balance', err)
      setWalletBalance('0')
    }
  }, [address, selectedContractsAddress])

  useEffect(() => {
    fetchWalletBalance()
    // reset amounts when toggling token to avoid accidental cross-token values
    setDepositAmount('')
    setWithdrawAmount('')
  }, [token, address, fetchWalletBalance])

  const handleMaxDeposit = () => setDepositAmount(walletBalance.toString())
  const handleMaxWithdraw = () => setWithdrawAmount((Number(gameAvailable) || 0).toString())

  // Deposit Handler (ERC20 Transfer)
  const openDepositConfirm = () => {
    const amount = Number(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero.')
      return
    }

    setConfirmText(
      <>
        Do you wish to deposit {amount} {token} to the game (
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

        const tokenContract = new Contract(selectedContractsAddress, ERC20_ABI, signer)
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
    if (isNaN(amount)) {
      setErrorMessage('Please enter a valid number.')
      return
    }
    if (amount < min) {
      setErrorMessage(`Amount must be greater than or equal to ${min}`)
      return
    }
    if (amount > max) {
      setErrorMessage(`Amount must be lower than or exactly ${max}`)
      return
    }

    if (token === 'PHORSE') {
      // Original PHORSE flow (with tax)
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

            await res.json() // { transactionId }
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
    } else {
      // WRON flow (no tax, different endpoint)
      setConfirmText(<>Do you wish to withdraw {amount} WRON from the game?</>)
      setConfirmAction(() => async () => {
        try {
          const res = await fetch(`${process.env.API_URL}/user/withdraw/wron`, {
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

          await res.json() // { transactionId }
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

      {errorMessage && <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />}

      {infoMessage && <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />}

      <div className={styles.overlay}>
        <div className={styles.modal}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          <div className={styles.title}>TOKEN BRIDGE</div>

          {/* 🔀 Token Toggle */}
          <div className={styles.toggleWrap} role="tablist" aria-label="Select token">
            {/* <button
              role="tab"
              aria-selected={token === 'PHORSE'}
              className={`${styles.toggleBtn} ${token === 'PHORSE' ? styles.toggleActive : ''}`}
              onClick={() => setToken('PHORSE')}
              type="button"
            >
              <Image src={phorseToken} alt="PHORSE" width={22} height={22} />
              <span>PHORSE</span>
            </button> */}
            <button
              role="tab"
              aria-selected={token === 'WRON'}
              className={`${styles.toggleBtn} ${token === 'WRON' ? styles.toggleActive : ''}`}
              onClick={() => setToken('WRON')}
              type="button"
            >
              <Image src={wronIcon} alt="WRON" width={22} height={22} />
              <span>WRON</span>
            </button>
          </div>

          {/* Deposit Row */}
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <input
                className={styles.input}
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
              />
              <div className={styles.available}>
                Available in wallet: {Number(walletBalance).toFixed(4)} {token}
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

          {/* Withdraw Row */}
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <div className={styles.inputSection}>
                <input
                  className={styles.input}
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={withdrawPlaceholder}
                />
              </div>
              <div className={styles.available}>
                Available ingame: {(Number(gameAvailable) || 0).toFixed(token === 'PHORSE' ? 0 : 4)} {token}
                {/* <br />
                Min. Withdraw:{' '}
                <span style={{ color: '#E21C21' }}>
                  {token === 'PHORSE' ? '1000' : '0.01'}
                </span>
                <br />
                Max. Withdraw:{' '}
                <span style={{ color: '#E21C21' }}>
                  {token === 'PHORSE' ? '100.000' : '10.000'}
                </span> */}
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
