import React, { useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import ConfirmModal from '../ConfirmModal'
import closeIcon from '@/assets/game/pop-up/fechar.png'
import { useUser } from '@/contexts/UserContext'

interface TokenBridgeProps {
    onClose: () => void
}

const TokenBridge: React.FC<TokenBridgeProps> = ({ onClose }) => {
    // valores disponíveis; ajuste conforme sua lógica
    const availableDeposit = 1000

    const [depositAmount, setDepositAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [confirmAction, setConfirmAction] = useState<() => void>(() => () => { })
    const { phorse, updateBalance } = useUser()

    const handleMaxDeposit = () =>
        setDepositAmount(availableDeposit.toString())

    const handleMaxWithdraw = () =>
        setWithdrawAmount(phorse.toString())

    const openDepositConfirm = () => {
        setConfirmText(
            `Do you wish to deposit ${depositAmount} PHORSE to the game?`
        )
        setConfirmAction(() => () =>
            console.log('Confirmed deposit!')
        )
        setShowConfirm(true)
    }

    const openWithdrawConfirm = () => {
        setConfirmText(
            `Do you wish to withdraw ${withdrawAmount} PHORSE from the game?`
        )
        setConfirmAction(() => () =>
            console.log('Confirmed withdraw!')
        )
        setShowConfirm(true)
    }

    const closeConfirm = () => setShowConfirm(false)
    const handleConfirm = () => {
        confirmAction()
        setShowConfirm(false)
    }

    return (
        <>
            {showConfirm && (
                <ConfirmModal
                    text={confirmText}
                    onClose={closeConfirm}
                    onConfirm={handleConfirm}
                />
            )}

            <div className={styles.overlay}>
                <div className={styles.modal}>
                    {/* 3. Botão X */}
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <Image src={closeIcon} alt="Close" width={30} height={30} />
                    </button>

                    {/* 2. Título */}
                    <div className={styles.title}>TOKEN BRIDGE</div>

                    {/* 4–9. Linhas de Deposit e Withdraw */}
                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <input
                                className={styles.input}
                                type="text"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                placeholder="0"
                            />
                            <button
                                className={styles.maxBtn}
                                onClick={handleMaxDeposit}
                                type="button"
                            >
                                max
                            </button>
                            <div className={styles.available}>Available: {availableDeposit}</div>

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
                                onChange={e => setWithdrawAmount(e.target.value)}
                                placeholder="0"
                            />
                            <button
                                className={styles.maxBtn}
                                onClick={handleMaxWithdraw}
                                type="button"
                            >
                                max
                            </button>
                            <div className={styles.available}>
                            Available: {phorse}
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
