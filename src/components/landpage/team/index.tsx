import React from 'react'
import styles from './styles.module.scss'
import t from '@/assets/team-cryptplanet/t.png'
import bizzo from '@/assets/team-cryptplanet/bizzo.png'
import ko from '@/assets/team-cryptplanet/ko.png'
import musk from '@/assets/team-cryptplanet/musk.png'
import naomi from '@/assets/team-cryptplanet/naomi.png'
import gusta from '@/assets/team-cryptplanet/gusta.png'
import jaum from '@/assets/team-cryptplanet/jaum.png'
import rays from '@/assets/team-cryptplanet/rayz.png'
import ano from '@/assets/team-cryptplanet/ano.png'
import davi from '@/assets/team-cryptplanet/davi.png'
import TeamCard from '../team-card'

const Team: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>TEAM</h1>
      <div className={styles.team}>
        <TeamCard image={t} name='T' position='marketing' />
        <TeamCard image={bizzo} name='bizzo' position='marketing manager' />
        <TeamCard image={ko} name='k.d' position='design' />
        <TeamCard image={musk} name='musk' position='tech lead' />
        <TeamCard image={naomi} name='naomi' position='blockchain - dev' />
        <TeamCard image={gusta} name='gusta' position='dev' />
        <TeamCard image={jaum} name='jaum' position='dev' />
        <TeamCard image={rays} name='rays' position='dev' />
        <TeamCard image={ano} name='ano' position='dev' />
        <TeamCard image={davi} name='davi' position='dev' />
      </div>

      <span>The team does not disclose their identities as the majority of the team is from Latin America and we need to be cautious for our own safety.</span>
      <span>We will be in the community discord voice room every day from 18 utc to 20 utc to ask questions and chat with the community.</span>
      <i className={styles.diviser} />
    </div>
  )
}

export default Team
