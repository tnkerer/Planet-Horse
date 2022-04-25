import React, { useRef } from 'react'
import styles from './styles.module.scss'

import TitleLayer from '../title-layer'

import { useIsVisible } from '@/utils/hooks/is-visible'

import TeamCard from '@/components/landpage/team-card'

import { TEAM } from './data'

const Team: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  return (
    <div className={styles.container} ref={myRef}>
      <div className={styles.container_header} />
      <div className={styles.container_team}>
        <div className={styles.team_title}>
          <TitleLayer>
            Team
          </TitleLayer>
        </div>
        <div className={`
          ${styles.team_cards}
          ${isVisible && styles.animation}
        `}>
         {TEAM.map(({ avatarImageFront, avatarImageBack, avatarName, realName, position, socialLink }, index) =>
          <>
            <div className={styles.cards_card}>
              <TeamCard
                key={index}
                index={index}
                to={socialLink}
                realName={realName}
                avatarName={avatarName}
                position={position}
                imageFront={avatarImageFront}
                imageBack={avatarImageBack}
                />
            </div>
          </>)}
        </div>
      </div>
    </div>
  )
}

export default Team
