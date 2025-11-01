import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import Image from 'next/image'

interface Props {
    closeModal: () => void
    status: boolean
    horseId: number
}

interface RaceReward {
    id: string
    createdAt: string
    phorseEarned: number
    wronEarned: number
    xpEarned: number
    position: number
    horseId: string
}

const ModalReward: React.FC<Props> = ({ closeModal, status, horseId }) => {
    const [rewards, setRewards] = useState<RaceReward[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!horseId || !status) return

        const fetchRewards = async () => {
            setLoading(true)
            setError(null)

            try {
                const res = await fetch(`${process.env.API_URL}/horses/${horseId}/races`, {
                    credentials: 'include',
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data = await res.json()
                setRewards(data)
            } catch (err: any) {
                console.error(err)
                setError('Failed to fetch race rewards.')
            } finally {
                setLoading(false)
            }
        }

        fetchRewards()
    }, [horseId, status])

    return (
        <div className={`${styles.modalReward} ${status ? styles.modalActive : styles.modalInactive}`}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent}>
                    <div className={styles.modalClose} onClick={closeModal}>
                        <Image width={30} height={30} src={close} alt="Close" />
                    </div>
                    <div className={styles.tableContent}>
                        {loading ? (
                            <div>Loading rewards...</div>
                        ) : error ? (
                            <div>{error}</div>
                        ) : rewards && rewards.length > 0 ? (
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Position</td>
                                        <td>PHORSE</td>
                                        <td>WRON</td>
                                        <td>XP</td>
                                        <td>Date</td>
                                    </tr>
                                    {rewards.map((reward) => (
                                        <tr key={reward.id}>
                                            <td>{reward.position}</td>
                                            <td>{reward.phorseEarned.toFixed(2)}</td>
                                            <td>{reward.wronEarned.toFixed(2)}</td>
                                            <td>{reward.xpEarned}</td>
                                            <td>{new Date(reward.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div>No race data available.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalReward
