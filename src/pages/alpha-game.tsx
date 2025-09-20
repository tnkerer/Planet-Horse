import React, { useState } from 'react'
import Pattern from '@/utils/components/pattern'
import Navbar from '@/utils/components/navbar'
import PageContent from '@/utils/components/page-content'
import Stables from '@/components/game/Stables'

const Game: React.FC = () => {
  const [view, setView] = useState('horses')

  const toogleView = (view: string) => {
    setView(view)
  }

  return (
    <>
      <Navbar />
      <PageContent>
          <Pattern type="brown">
            <Stables changeView={toogleView} />
          </Pattern>
      </PageContent>
    </>
  )
}

export default Game
