import React from 'react'
import styles from './styles.module.scss'
import HorseLegendary from '@/assets/game/horses/horse.png'
import getHorseImage from '@/utils/hooks/single-horse-image'
import Image from 'next/image'
import { Horse } from '@/domain/models/Horse'

interface Props {
  horse: Horse
  openModal: (modalType: string, horseId?: number) => void
}

const SingleHorse: React.FC<Props> = ({ horse, openModal }) => {
  const { loading, image } = getHorseImage(horse)
  return (
        <>
        <div className={styles.singleHorse + ' type-' + horse.profile.type_horse_slug}>
            <div className={styles.maskCard}>
                <div className={styles.horseGif}>
                    {loading
                      ? (null)
                      : (<img src={image.src} />)}
                </div>
                <div className={styles.horseInfo}>
                    <div className={styles.horseWrapper}>
                        <div className={styles.horseProfile}>
                            <div className={styles.horseItemDescriptionBox}>
                                <div className={styles.horseItemDescription}>
                                    NAME: <span>{horse.profile.name}</span>
                                </div>
                                <div className={styles.horseItemDescription}>
                                    SEX: <span className={styles.horseItemDescriptionBlue}>{horse.profile.sex}</span>
                                </div>
                            </div>
                            <div className={styles.horseItemDescription}>
                                TYPE HORSE: <span className={styles.horseItemDescriptionRed}>{horse.profile.type_horse}</span>
                            </div>
                            <div className={styles.horseItemDescription}>
                                TYPE JOCKEY: <span className={styles.horseItemDescriptionGray}>{horse.profile.type_jockey}</span>
                            </div>
                            <div className={styles.horseItemDescription}>
                                TIME: <span>{horse.profile.time}</span>
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
                            {horse.items.map((item) => (
                                <div key={item.id} className={styles.singleItem}>
                                    {item.id}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.horseButtons}>
                        <div className={styles.singleButton}>
                            <button className={styles.buyButton}
                                onClick={() => openModal('reward', horse.id)}
                            ></button>
                        </div>
                        <div className={styles.singleButton}>
                            <button className={styles.itemsButton}
                                /* onClick={setPopUp('chest')} */
                            ></button>
                        </div>
                        <div className={styles.singleButton}>
                            <button className={styles.quickraceButton}
                                onClick={() => openModal('quickRace', horse.id)}
                            ></button>
                        </div>
                        <div className={styles.singleButton}>
                            <button className={styles.startButton}
                                onClick={() => openModal('raceStart', horse.id)}
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
