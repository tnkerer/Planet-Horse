import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import getHorseImage from '@/utils/hooks/single-horse-image'
import { Horse } from '@/domain/models/Horse'
import { mock_items } from '@/utils/mocks/game'

const itemsMap: Record<number, { id: number; name: string; src: string }> = {} as any
mock_items.forEach(it => {
  itemsMap[it.id] = it as any
})

interface Props {
  horse: Horse
  openModal: (modalType: string, horseId?: number) => void
}


const rarityColorMap: Record<string, string> = {
  common: '#00aa00',
  uncommon: '#2F35A8',
  rare: '#800080',
  epic: '#ff69b4',
  legendary: '#a78e06',
  mythic: '#E21C21'
}

const sexColorMap: Record<string, string> = {
  male: '#2F35A8',
  female: '#dc207e'
}

const defaultColor = '#919191'

const SingleHorse: React.FC<Props> = ({ horse, openModal }) => {
  const { loading, image } = getHorseImage(horse)

  const slug = horse.profile.type_horse_slug
  const labelColor = rarityColorMap[slug] ?? defaultColor

  const sexSlug = horse.profile.sex.toLowerCase()
  const sexColor = sexColorMap[sexSlug] ?? defaultColor

  const slots = Array.from({ length: 3 }, (_, i) => horse.items[i] || null)

  return (
    <>
      <div className={styles.singleHorse + ' type-' + horse.profile.type_horse_slug}>
        <div className={styles.maskCard}>
          <div className={styles.horseId}>{horse.id}</div>

          <div className={styles.horseGif}>
            {loading ? null : <img src={image?.src} alt={horse.profile.name} />}
          </div>

          <div className={styles.horseInfo}>
            <div className={styles.horseWrapper}>
              <div className={styles.horseProfile}>
                <div className={styles.horseItemDescriptionBox}>
                  <div className={styles.horseItemDescription}>
                    NAME: <span>{horse.profile.name}</span>
                  </div>
                  <div className={styles.horseItemDescription}>
                    SEX:{' '}
                    <span
                      className={styles.horseItemDynamic}
                      style={{ color: sexColor }}
                    >
                      {horse.profile.sex}
                    </span>
                  </div>
                </div>
                <div className={styles.horseItemDescription}>
                  HORSE TYPE:{' '}
                  <span className={styles.horseItemDynamic} style={{ color: labelColor }}>
                    {horse.profile.type_horse}
                  </span>
                </div>
                <div className={styles.horseItemDescription}>
                  STABLE TYPE:{' '}
                  <span className={styles.horseItemDescriptionGray}>
                    {horse.profile.type_jockey}
                  </span>
                </div>
                <div className={styles.horseItemDescription}>
                  STATUS: <span>{horse.staty.status}</span>
                </div>
              </div>

              <div className={styles.horseStaty}>
                <div className={styles.horseItemDescription}>
                  LEVEL: <span>{horse.staty.level}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  EXP: <span>{horse.staty.exp}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  POWER: <span>{horse.staty.power}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  SPRINT: <span>{horse.staty.sprint}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  SPEED: <span>{horse.staty.speed}</span>
                </div>
                <div className={styles.horseItemDescription}>
                  ENERGY: <span>{horse.staty.energy}</span>
                </div>
              </div>

              <div className={styles.horseItems}>
                {slots.map((slot, idx) => (
                  <div key={idx} className={styles.singleItem}>
                    {slot && itemsMap[slot.id] && (
                      <Image
                        src={`/assets/items/${itemsMap[slot.id].src}.webp`}
                        alt={itemsMap[slot.id].name}
                        layout="fill"
                        objectFit="contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.horseButtons}>
              <div className={styles.singleButton}>
                <button
                  className={styles.buyButton}
                  onClick={() => openModal('reward', horse.id)}
                ></button>
              </div>

              <div className={styles.singleButton}>
                <button
                  className={styles.itemsButton}
                  onClick={() => openModal('items', horse.id)}
                ></button>
              </div>

              <div className={styles.singleButton}>
                <button
                  className={styles.restoreButton}
                  onClick={() => openModal('restore', horse.id)}
                  disabled={horse.staty.status !== 'bruised'}
                ></button>
              </div>

              <div className={styles.singleButton}>
                <button
                  className={styles.startButton}
                  onClick={() => openModal('raceStart', horse.id)}
                  disabled={horse.staty.status !== 'idle'}
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SingleHorse
