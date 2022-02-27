import React, {useEffect} from 'react'
import styles from './styles.module.scss'
import t from '@/assets/landing-page/team/t.webp'
import bizzo from '@/assets/landing-page/team/bizzo.webp'
import ko from '@/assets/landing-page/team/ko.webp'
import musk from '@/assets/landing-page/team/musk.webp'
import naomi from '@/assets/landing-page/team/naomi.webp'
import gusta from '@/assets/landing-page/team/gusta.webp'
import jaum from '@/assets/landing-page/team/jaum.webp'
import rayz from '@/assets/landing-page/team/rayz.webp'
import ano from '@/assets/landing-page/team/ano.webp'
import davi from '@/assets/landing-page/team/davi.webp'
import TeamCard from '../team-card'

const Team: React.FC = () => {
  useEffect(() => {
    const team = document.getElementById('team')
    team.addEventListener('contextmenu', e => e.preventDefault())
  }, [])

  return (
    <div className={styles.container}>
      <h1>TEAM</h1>
      <div className={styles.team} id='team'>
        <TeamCard image={t} name='T' position='content manager' />
        <TeamCard image={bizzo} name='bizzo' position='marketing manager' />
        <TeamCard image={ko} name='k.d' position='design' />
        <TeamCard image={musk} name='musk' position='tech lead' />
        <TeamCard image={naomi} name='naomi' position='blockchain - dev' />
        <TeamCard image={davi} name='davi' position='dev' />
        <TeamCard image={jaum} name='jaum' position='dev' />
        <TeamCard image={rayz} name='rayz' position='dev' />
        <TeamCard image={ano} name='ano' position='dev' />
        <TeamCard image={gusta} name='gusta' position='dev' />
      </div>

      <span>The team does not disclose their identities as the majority of the team is from Latin America and we need to be cautious for our own safety.</span>
      <span>We will be in the community discord voice room every day from 18 utc to 20 utc to ask questions and chat with the community.</span>
      <i className={styles.diviser} />
    </div>
  )
}

export default Team
