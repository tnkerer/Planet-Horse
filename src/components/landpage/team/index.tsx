import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import TeamCard from '../team-card'
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
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

interface Props {
  scrollValueToAnimate?: number
}

const Team: React.FC<Props> = ({ scrollValueToAnimate }) => {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useContext(ScrollYValueContext)
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const elementAppearsToUser = scrollY >= scrollValueToAnimate
    const screenWidthResolution = window.innerWidth
    elementAppearsToUser && setScrolled(true)
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  useEffect(() => {
    const team = document.getElementById('team')
    team.addEventListener('contextmenu', e => e.preventDefault())
  }, [])

  return (
    <div className={styles.container}>
      <h1
        style={{
          opacity: scrolled || screenWidth <= 810 ? 1 : 0
        }}
      >
        TEAM
      </h1>
      <div
        className={styles.team}
        id='team'
        style={{
          opacity: scrollY >= 4050 || screenWidth <= 810 ? 1 : 0
        }}
      >
        <TeamCard imageFront={t} imageBack={tFace} avatarName='T' realName='natã' position='marketing' index={0} to='https://www.linkedin.com/in/natã-teixeira-916596228/' />
        <TeamCard imageFront={bizzo} imageBack={bizzoFace} avatarName='deividy' realName='deividy' position='marketing' index={1} to='https://twitter.com/deividy1864' />
        <TeamCard imageFront={musk} imageBack={muskFace} avatarName='musk' realName='igor' position='dev' index={2} to='https://www.linkedin.com/in/igorjcqs' />
        <TeamCard imageFront={ko} imageBack={koFace} avatarName='koroshy' realName='vinícius' position='artist' index={3} to='https://www.behance.net/Koroshy' />
        <TeamCard imageFront={davi} imageBack={daviFace} avatarName='davi' realName='davi' position='dev' index={4} to='https://www.linkedin.com/in/davi-freitas-156729185' />
        <TeamCard imageFront={ano} imageBack={anoFace} avatarName='juliano' realName='juliano' position='advisor' index={5} to='https://www.linkedin.com/in/juliano-senfft' />
        <TeamCard imageFront={rayz} imageBack={rayzFace} avatarName='rayz' realName='sérgio' position='dev' index={6} to='https://www.behance.net/railsonsergio' />
        <TeamCard imageFront={jaum} imageBack={jaumFace} avatarName='jaum' realName='João' position='dev' index={7} to='https://www.linkedin.com/in/jaumdark' />
      </div>

      <span
        style={{
          opacity: scrollY >= 4650 || screenWidth <= 810 ? 1 : 0
        }}
      >We will be in our discord server at voice room everyday from 21 UTC to 22 UTC to reply questions and chat with the community.</span>
      <i className={styles.diviser} />
    </div>
  )
}

export default Team
