import React, { useRef, useState, useEffect } from 'react'
import styles from './styles.module.scss'

import TitleLayer from '../title-layer'

import TeamCard from '@/components/landpage/team-card'
import t from '@/assets/landing-page/team/avatars/t.webp'
import bizzo from '@/assets/landing-page/team/avatars/bizzo.webp'
import ko from '@/assets/landing-page/team/avatars/ko.webp'
import musk from '@/assets/landing-page/team/avatars/musk.webp'
import jaum from '@/assets/landing-page/team/avatars/jaum.webp'
import rayz from '@/assets/landing-page/team/avatars/rayz.webp'
import ano from '@/assets/landing-page/team/avatars/ano.webp'
import davi from '@/assets/landing-page/team/avatars/davi.webp'
import tFace from '@/assets/landing-page/team/faces/t.webp'
import bizzoFace from '@/assets/landing-page/team/faces/bizzo.webp'
import koFace from '@/assets/landing-page/team/faces/ko.webp'
import muskFace from '@/assets/landing-page/team/faces/musk.webp'
import jaumFace from '@/assets/landing-page/team/faces/jaum.webp'
import rayzFace from '@/assets/landing-page/team/faces/rayz.webp'
import anoFace from '@/assets/landing-page/team/faces/ano.webp'
import daviFace from '@/assets/landing-page/team/faces/davi.webp'

const Team: React.FC = () => {
  const myRef = useRef()
  const [IsVisble, setIsVisble] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const { isIntersecting } = entries[0]
      isIntersecting && setIsVisble(isIntersecting)
    })
    observer.observe(myRef.current)
  }, [])

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
          ${IsVisble ? styles.animation : ''}
        `}>
          <div className={styles.cards_card}>
            <TeamCard imageFront={t} imageBack={tFace} avatarName='T' realName='natã' position='CEO' index={0} to='https://www.linkedin.com/in/natã-teixeira-916596228/' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={bizzo} imageBack={bizzoFace} avatarName='deividy' realName='deividy' position='marketing' index={1} to='https://twitter.com/deividy1864' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={musk} imageBack={muskFace} avatarName='musk' realName='igor' position='dev' index={2} to='https://www.linkedin.com/in/igorjcqs' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={ko} imageBack={koFace} avatarName='koroshy' realName='vinícius' position='artist' index={3} to='https://www.behance.net/Koroshy' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={davi} imageBack={daviFace} avatarName='davi' realName='davi' position='dev' index={4} to='https://www.linkedin.com/in/davi-freitas-156729185' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={ano} imageBack={anoFace} avatarName='juliano' realName='juliano' position='advisor' index={5} to='https://www.linkedin.com/in/juliano-senfft' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={rayz} imageBack={rayzFace} avatarName='rayz' realName='sérgio' position='dev' index={6} to='https://www.behance.net/railsonsergio' />
          </div>
          <div className={styles.cards_card}>
            <TeamCard imageFront={jaum} imageBack={jaumFace} avatarName='jaum' realName='João' position='dev' index={7} to='https://www.linkedin.com/in/jaumdark' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Team
