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
import PlanetHorseGame from '@/components/landpage/planethorse-game'
import { ScrollYValueProvider } from '@/utils/providers/scroll-y-value'
import SetterScrollYValue from '@/utils/components/setter-scrollY-value'

function App () {
  return (
    <ScrollYValueProvider>
      <SetterScrollYValue />
      <Banner />
      <Pattern type='light'>
        <Gameplay />
        <NFTHorses scrollValueToAnimate={1300} />
      </Pattern>
      <Pattern type='dark'>
        <WhitePaper scrollValueToAnimate={2900} />
        <Token scrollValueToAnimate={3300} />
        <Team scrollValueToAnimate={3900} />
      </Pattern>
      <Blackboard />
      <SocialMidia />
    </ScrollYValueProvider>
  )
}

export default App
