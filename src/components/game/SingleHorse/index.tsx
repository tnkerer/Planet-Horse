import React from 'react'
import styles from './styles.module.scss'
import getHorseImage from '@/utils/hooks/single-horse-image'
import { Horse } from '@/domain/models/Horse'

interface Props {
    horse: Horse
    openModal: (modalType: string, horseId?: number) => void
}

const rarityColorMap: Record<string, string> = {
    common: '#00aa00',  // verde
    uncommon: '#2F35A8',  // azul
    rare: '#800080',  // púrpura
    epic: '#ff69b4',  // rosa
    legendary: '#a78e06',  // dourado
    mythic: '#E21C21'   // vermelho
}

const sexColorMap: Record<string, string> = {
    male: '#2F35A8', // azul
    female: '#dc207e'  // rosa
}

const defaultColor = '#919191'  // cinza fallback

const SingleHorse: React.FC<Props> = ({ horse, openModal }) => {
    const { loading, image } = getHorseImage(horse)

    const slug = horse.profile.type_horse_slug
    const labelColor = rarityColorMap[slug] ?? defaultColor

    const sexSlug = horse.profile.sex.toLowerCase()
    const sexColor = sexColorMap[sexSlug] ?? defaultColor
    return (
        <>
            <div className={styles.singleHorse + ' type-' + horse.profile.type_horse_slug}>
                <div className={styles.maskCard}>
                <div className={styles.horseId}>{horse.id}</div>
                    <div className={styles.horseGif}>
                        {loading
                            ? (null)
                            : (<img src={image?.src} />)}
                    </div>
                    <div className={styles.horseInfo}>
                        <div className={styles.horseWrapper}>
                            <div className={styles.horseProfile}>
                                <div className={styles.horseItemDescriptionBox}>
                                    <div className={styles.horseItemDescription}>
                                        NAME: <span>{horse.profile.name}</span>
                                    </div>
                                    <div className={styles.horseItemDescription}>
                                        SEX:        <span
                                            className={styles.horseItemDynamic}
                                            style={{ color: sexColor }}
                                        >
                                            {horse.profile.sex}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.horseItemDescription}>
                                    HORSE TYPE: <span
                                        className={styles.horseItemDynamic}
                                        style={{ color: labelColor }}
                                    >
                                        {horse.profile.type_horse}
                                    </span>
                                </div>
                                <div className={styles.horseItemDescription}>
                                    STABLE TYPE: <span className={styles.horseItemDescriptionGray}>{horse.profile.type_jockey}</span>
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
                                <button className={styles.restoreButton}
                                    onClick={() => openModal('restore', horse.id)}
                                    disabled={horse.staty.status !== 'bruised'}
                                /* onClick={() => openModal('quickRace', horse.id)} */
                                ></button>
                            </div>
                            <div className={styles.singleButton}>
                                <button className={styles.startButton}
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