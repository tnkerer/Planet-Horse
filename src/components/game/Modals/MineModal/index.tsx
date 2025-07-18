import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import ErrorModal from '../ErrorModal'

interface Props {
    setVisible: Dispatch<SetStateAction<boolean>>
    status: boolean
}

const MineModal: React.FC<Props> = ({ setVisible, status }) => {
    const fullText = 'Hi, I am Master Artificer Bruno! What would you like to do today?'
    const [displayedText, setDisplayedText] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [textFinished, setTextFinished] = useState(false)

    useEffect(() => {
        if (!status) return
        setDisplayedText('')
        setErrorMessage(null)
        setTextFinished(false)

        let i = 0
        const timer = setInterval(() => {
            i++
            setDisplayedText(fullText.slice(0, i))
            if (i >= fullText.length) {
                clearInterval(timer)
                setTextFinished(true)
            }
        }, 50)
        return () => clearInterval(timer)
    }, [status, fullText])

    if (!status) return null

    return (
        <>
            {errorMessage && (
                <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            <div className={`${styles.modalRecovery} ${status ? styles.modalActive : styles.modalInactive}`}>
                <div className={styles.modalFull}>
                    {/* Main centered content with background */}
                    <div className={styles.modalContent}>
                        <div className={styles.modalClose} onClick={() => setVisible(false)}>
                            <Image src={close} alt="Close" width={30} height={30} />
                        </div>
                    </div>

                    {/* Dialog + Character OUTSIDE modalContent */}
                    <div className={styles.dialogWrapper}>
                        <img src="/assets/characters/miner.png" alt="Miner" className={styles.minerCharacter} />

                        <div className={styles.rpgDialogBox}>
                            <div className={styles.dialogText}>
                                {displayedText}
                                <span className={styles.cursor}>|</span>
                            </div>

                            {textFinished && <div className={styles.answerBox}>
                                <div className={styles.answerOption} onClick={() => console.log('YES CLICKED')}>
                                    Upgrade Items
                                </div>
                                <div className={styles.answerOption} onClick={() => console.log('NO CLICKED')}>
                                    Create Medal Bag
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MineModal
