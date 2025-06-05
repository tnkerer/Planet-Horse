import React, { useState } from 'react'
import styles from './styles.module.scss'
import ModalReward from '../Modals/Reward'
import ModalRaceStart from '../Modals/RaceStart'
import RecoveryCenter from '../Modals/RecoveryCenter'
import ItemBag from '../Modals/ItemBag'
import SingleHorse from '../SingleHorse'
import { horses } from '@/utils/mocks/game'
import { Items } from '@/domain/models/Item'
import Image from 'next/image'
import Link from 'next/link'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medal from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'

interface Props {
  changeView: (view: string) => void
}

const Horses: React.FC<Props> = ({ changeView }) => {
  const [modalReward, setToogleModalReward] = useState(false)
  const [modalRaceStart, setToogleModalRaceStart] = useState(false)
  const [modalRestore, setToogleModalRestore] = useState(false)
  const [modalItems, setModalItems] = useState(false)
  const [horseId, sethorseId] = useState(0)
  const [horsesData, setHorsesData] = useState(horses)
  const { phorse, medals } = useUser()

  const toogleModal = (modalType: string, horseId?: number) => {
    if (horseId) {
      sethorseId(horseId)
    } else {
      sethorseId(0)
    }

    if (modalType === 'reward') {
      setToogleModalReward(!modalReward)
    }

    if (modalType === 'raceStart') {
      setToogleModalRaceStart(!modalRaceStart)
    }

    if (modalType === 'restore') {
      setToogleModalRestore(!modalRestore)
    }

    if (modalType === 'items') {
      setModalItems(!modalItems)
    }
  }

  const handleEquipItem = (item: Items): void => {
    if (!horseId) return
    setHorsesData(prev =>
      prev.map(h => {
        if (h.id === horseId) {
          const items = h.items ? [...h.items] : []
          const slot = items.findIndex(it => it == null)
          if (slot !== -1) {
            items[slot] = { id: item.id }
          } else if (items.length < 3) {
            items.push({ id: item.id })
          }
          return { ...h, items }
        }
        return h
      })
    )
  }

  return (
    <>
      <ModalReward closeModal={toogleModal} status={modalReward} horseId={horseId} />
      <ModalRaceStart closeModal={toogleModal} status={modalRaceStart} horseId={horseId} />
      <ItemBag
        status={modalItems}
        closeModal={toogleModal}
        onEquipItem={handleEquipItem}
      />
      {modalRestore && (
        <RecoveryCenter
          status={modalRestore}
          horseId={horseId}
          cost={1000}
          closeModal={toogleModal}
        />
      )}
      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={styles.bagButton}
                onClick={() => toogleModal('items')}
                aria-label="Open Bag"
              >
                <span className={styles.notificationBadge}></span>
              </button>
              {/* <div>CURE ALL HORSES</div>
              <div>QUICK RACE</div>
              <div>REWARDS OF SOLD HORSES</div> */}
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src={phorseToken} alt="phorse coin" />
            <span>{phorse | 0}</span>
            <Image width={29} height={40} src={medal} alt="medals" />
            <span>{medals | 0}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <span className={styles.countHorses}>{horsesData.length} Horses</span>

        <div className={styles.cardHorses}>
          {horsesData.map(horse => (
            <SingleHorse openModal={toogleModal} key={horse.id} horse={horse} />
          ))}

          <div className={styles.addHorse}>
            <div className={styles.addHorseWrapper}>
              <div className={styles.plusHorse}>+</div>
              <div className={styles.addHorseText}>
                <Link href="https://opensea.io/0x96ca93ac0d9e26179dcd11db08af88a3506e8f03/created">
                  <a
                    className={styles.addHorseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GRAB SOME HORSES AND YOU WILL BE ON YOUR WAY TO RUNNING LIKE A PRO!
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Horses
