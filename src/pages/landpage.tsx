import React from 'react'
import { ScrollYValueProvider } from '@/utils/providers/scroll-y-value'
import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import Gameplay from '@/components/landpage/gameplay'
import Token from '@/components/landpage/token'
import Team from '@/components/landpage/team'

function App () {
  return (
    <ScrollYValueProvider>
      <Presentation />
      <Milestones />
      <Gameplay />
      <Token />
      <Team />
    </ScrollYValueProvider>
  )
}

export default App
