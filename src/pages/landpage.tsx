import React from 'react'
import Banner from '@/components/landpage/banner'
import Pattern from '@/utils/components/pattern'
import Gameplay from '@/components/landpage/gameplay'
import NFTHorses from '@/components/landpage/nft-horses'
import WhitePaper from '@/components/landpage/white-paper'
import Token from '@/components/landpage/token'
import Team from '@/components/landpage/team'
import Blackboard from '@/components/landpage/blackboard'
import SocialMidia from '@/components/landpage/social-midia'

function App () {
  return (
    <>
      <Banner />
      <Pattern type='light'>
        <Gameplay />
        <NFTHorses />
      </Pattern>
      <Pattern type='dark'>
        <WhitePaper />
        <Token />
        <Team />
      </Pattern>
      <Blackboard />
      <SocialMidia />
    </>
  )
}

export default App
