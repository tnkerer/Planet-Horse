import React from 'react'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

import { rewards } from '@/utils/mocks/game'
import Image from 'next/image'

interface Props {
  closeModal: (modalType: string, horseId?: number) => void
  status: boolean
  horseId: number
}

const ModalReward: React.FC<Props> = ({ closeModal, status, horseId }) => {
  // const [horseId, setHorseId] = useState(horse)
  // const [horseData, setHorseData] = useState(null)

  const horseMock = rewards
  /*
    loadHorseRewards()

    function loadHorseRewards(){
        if(!horseData){
            setHorseData(horseMock)
        }
    }
    */

  return (
        <div className={`${styles.modalReward} ${status ? styles.modalActive : styles.modalInactive}`}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent}>
                    <div className={styles.modalClose} onClick={() => closeModal('reward')}>
                        <Image width={'30px'} height={'30px'} src={close} />
                    </div>
                    <div className={styles.tableInfo}>
                        <div className={styles.tableInfoRewards}>

                            <div>Total Rewards: 2 PHORSE</div>
                            <div>Jan 02, 2022 (UTC+0)</div>
                        </div>
                        <div className={styles.tableInfoFee}>
                            <div>(clain) fee 10% phorse</div>
                        </div>
                    </div>
                    <div className={styles.tableContent}>
                        <table>

                            {!horseMock
                              ? (
                                <div>
                                    Getting horse data...
                                </div>
                                )
                              : (
                                <tbody>

                                    {horseMock.map((reward) => (
                                        <tr key={reward.id}>
                                            <td> {reward.dado_1} </td>
                                            <td> {reward.dado_2} </td>
                                            <td> {reward.dado_3} </td>
                                            <td> {reward.dado_4} </td>
                                            <td> {reward.dado_5} </td>
                                            <td> {reward.dado_6} </td>
                                        </tr>
                                    ))}
                                </tbody>
                                )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
  )
}

export default ModalReward
