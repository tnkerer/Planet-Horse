import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import getResultImage from '@/utils/hooks/race-result-image'

interface Props {
  horseResult: number
}

const RaceFinish: React.FC<Props> = ({ horseResult }) => {
  const { loading, image } = getResultImage(horseResult)

  console.log('image')
  console.log(image)


  return (
    <div className={styles.raceResultContent}>
        {!loading &&
            <div className={styles.raceResultImage}>
                <img src={image.src} />
            </div>
        }
    </div>
  )
}

export default RaceFinish
