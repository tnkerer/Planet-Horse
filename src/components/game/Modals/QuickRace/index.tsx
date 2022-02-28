import React from 'react'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

import Image from 'next/image'

interface Props {
  closeModal: (modalType: string, horseId?: number) => void
  status: boolean
  horseId: number
}

const ModalQuickRace: React.FC<Props> = ({ closeModal, status, horseId }) => {
  // const [horseId, setHorseId] = useState(horse)
  // const [horseData, setHorseData] = useState(null)

  return (
        <div className={`${styles.modalQuickRace} ${status ? styles.modalActive : styles.modalInactive}`}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent}>
                    <div className={styles.modalClose} onClick={() => closeModal('quickRace')}>
                        <Image width={'30px'} height={'30px'} src={close} />
                    </div>
                    <div className={styles.modalInfo}>
                        Waiting Modal Layout
                    </div>
                </div>
            </div>
        </div>
  )
}

export default ModalQuickRace
