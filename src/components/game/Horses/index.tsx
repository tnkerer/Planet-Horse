import React, { useState, useEffect, useCallback } from 'react'
import styles from './styles.module.scss'
import ItemBag from '../Modals/ItemBag'
import SingleHorse from '../SingleHorse'
import Image from 'next/image'
import Link from 'next/link'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medal from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'
import { useWallet } from '@/contexts/WalletContext'

interface BackendHorse {
  tokenId: string
  name: string
  sex: 'MALE' | 'FEMALE'
  status: string
  rarity: string
  exp: number
  upgradable: boolean
  level: number
  currentPower: number
  currentSprint: number
  currentSpeed: number
  currentEnergy: number
  maxEnergy: number
  equipments: Array<{ id: string }>
}

export interface Horse {
  id: number
  profile: {
    name: string
    name_slug: string
    sex: string
    type_horse: string
    type_horse_slug: string
    type_jockey: string
    time: string
  }
  staty: {
    status: string
    level: string
    exp: string
    upgradable: boolean
    power: string
    sprint: string
    speed: string
    energy: string
  }
  items: Array<{ id: number }>
}

const Horses: React.FC = ({ }) => {
  const [modalItems, setModalItems] = useState(false)
  const { phorse, medals, updateBalance } = useUser()
  const { isAuthorized, address } = useWallet()

  const [horseList, setHorseList] = useState<Horse[]>([]);

  // load live horses once authorized
  const loadHorses = useCallback(async () => {
    if (!address) {
      setHorseList([]);
      return;
    }
    updateBalance()
    try {
      const res = await fetch(`${process.env.API_URL}/horses`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as BackendHorse[];
      const mapped: Horse[] = data.map((h) => {
        const idNum = Number(h.tokenId);
        const raritySlug = h.rarity.toLowerCase();
        return {
          id: idNum,
          profile: {
            name: h.name,
            name_slug: h.name.toLowerCase().replace(/\s+/g, '-'),
            sex: h.sex.toLowerCase(),
            type_horse: h.rarity.toUpperCase(),
            type_horse_slug: raritySlug,
            type_jockey: 'NONE',
            time: '120 Days',
          },
          staty: {
            status: h.status,
            level: String(h.level),
            exp: `${String(h.exp)}`,
            upgradable: h.upgradable,
            power: String(h.currentPower),
            sprint: String(h.currentSprint),
            speed: String(h.currentSpeed),
            energy: `${h.currentEnergy}/${h.maxEnergy}`,
          },
          items:
            h.equipments.length > 0
              ? h.equipments.map((e) => ({ id: Number(e.id) }))
              : [{ id: 1 }, { id: 2 }, { id: 3 }],
        };
      });

      setHorseList(mapped);
    } catch (err) {
      console.error('Failed to load horses:', err);
      setHorseList([]);
    }
  }, [isAuthorized, address])

  useEffect(() => {
    loadHorses();
  }, [loadHorses])

  const toogleModal = (modalType: string) => {
    switch (modalType) {
      case 'items': return setModalItems(r => !r)
    }
  }

  return (
    <>
      <ItemBag status={modalItems} closeModal={toogleModal} />
      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                onClick={() => toogleModal('items')}
                aria-label="Open Bag"
              >
                <span className={styles.notificationBadge}></span>
              </button>
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src={phorseToken} alt="phorse coin" />
            <span>{phorse || 0}</span>
            <Image width={29} height={40} src={medal} alt="medals" />
            <span>{medals || 0}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <span className={styles.countHorses}>
          {horseList.length} Horses
        </span>

        <div className={styles.cardHorses}>
          {horseList.map(h => (
            <SingleHorse
              key={h.id}
              horse={h}
              reloadHorses={loadHorses}
            />
          ))}

          <div className={styles.addHorse}>
            <div className={styles.addHorseWrapper}>
              <div className={styles.plusHorse}>+</div>
              <div className={styles.addHorseText}>
                <Link
                  href="https://opensea.io/0x96ca93ac0d9e26179dcd11db08af88a3506e8f03/created"
                  passHref
                >
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
