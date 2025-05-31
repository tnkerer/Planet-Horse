import React, { useState } from 'react'
import styles from './styles.module.scss'
import { Horse } from '@/domain/models/Horse'
import { xpProgression } from '@/utils/constants/xp-progression'
import ModalRaceStart from '../Modals/RaceStart'
import RecoveryCenter from '../Modals/RecoveryCenter'

interface Props {
    horse: Horse
    reloadHorses: () => Promise<void>
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

const SingleHorse: React.FC<Props> = ({ horse, reloadHorses }) => {
    const [modalRecovery, setModalRecovery] = useState(false)
    const [modalRaceStart, setModalRaceStart] = useState(false)
    const slug = horse.profile.type_horse_slug
    const labelColor = rarityColorMap[slug] ?? defaultColor

    const sexSlug = horse.profile.sex.toLowerCase()
    const sexColor = sexColorMap[sexSlug] ?? defaultColor
    const maxXp: string = (xpProgression[Number(horse.staty.level)] ?? 0).toString()
    const xp = `${horse.staty.exp.toString()}/${maxXp}`
    const recoveryCost = parseInt(horse.staty.level) * 50

    return (
        <>
            {modalRaceStart ? (<ModalRaceStart 
                status={modalRaceStart} 
                horse={horse}
                setVisible={setModalRaceStart}
                onRaceEnd={reloadHorses}
            />) : (null)}
            {modalRecovery ? (<RecoveryCenter
                status={modalRecovery}
                horseId={horse.id}
                cost={recoveryCost}
                setVisible={setModalRecovery}
                onRestored={reloadHorses}
            />) : (null)}
            <div className={styles.singleHorse + ' type-' + horse.profile.type_horse_slug}>
                <div className={styles.maskCard}>
                    <div className={styles.horseId}>{horse.id}</div>
                    <div className={styles.horseGif}>
                        <img src={`/assets/game/horses/gifs/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-${horse.staty.status}.gif`} />
                    </div>
                    <div className={styles.horseInfo}>
                        <div className={styles.horseWrapper}>
                            <div className={styles.horseProfile}>
                                <div className={styles.horseItemDescriptionBox}>
                                    <div className={styles.horseItemDescription}>
                                        NAME: <span>{horse.profile.name.slice(0, 12)}</span>
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
                                    EXP: <span>{xp}</span>
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
                            {/* <div className={styles.singleButton}>
                                <button className={styles.buyButton}
                                    onClick={() => openModal('reward', horse.id)}
                                ></button>
                            </div> */}
                            <div className={styles.singleButton}>
                                <button className={styles.itemsButton}
                                /* onClick={setPopUp('chest')} */
                                ></button>
                            </div>
                            <div className={styles.singleButton}>
                                <button className={styles.restoreButton}
                                    onClick={() => { setModalRecovery(true) }}
                                    disabled={horse.staty.status !== 'BRUISED'}
                                /* onClick={() => openModal('quickRace', horse.id)} */
                                ></button>
                            </div>
                            <div className={styles.singleButton}>
                                <button className={styles.startButton}
                                    onClick={() => { setModalRaceStart(true) }}
                                    disabled={horse.staty.status !== 'IDLE'}
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