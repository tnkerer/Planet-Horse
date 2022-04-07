import React from 'react'
import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import Pattern from '@/utils/components/pattern'
import Gameplay from '@/components/landpage/gameplay'
import NFTHorses from '@/components/landpage/nft-horses'
import WhitePaper from '@/components/landpage/white-paper'
import Token from '@/components/landpage/token'
import Team from '@/components/landpage/team'
import Blackboard from '@/components/landpage/blackboard'
import SocialMidia from '@/components/landpage/social-midia'
import { ScrollYValueProvider } from '@/utils/providers/scroll-y-value'
import { FlipperProvider } from '@/utils/providers/flipper'

function App () {
  return (
    <ScrollYValueProvider>
      <Presentation />
      <Milestones />
      <Pattern type='light'>
        <Gameplay />
        <NFTHorses scrollValueToAnimate={1300} />
      </Pattern>
      <Pattern type='dark'>
        <WhitePaper scrollValueToAnimate={2900} />
        <Token scrollValueToAnimate={3300} />
        <FlipperProvider>
          <Team scrollValueToAnimate={3900} />
        </FlipperProvider>
      </Pattern>
      <Blackboard />
    </ScrollYValueProvider>
  )
}

export default App
