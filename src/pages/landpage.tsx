import React from 'react'
import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import Gameplay from '@/components/landpage/gameplay'
import { ScrollYValueProvider } from '@/utils/providers/scroll-y-value'

function App () {
  return (
    <ScrollYValueProvider>
      <Presentation />
      <Milestones />
      <Gameplay />
    </ScrollYValueProvider>
  )
}

export default App
