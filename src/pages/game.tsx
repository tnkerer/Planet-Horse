import React, { useState } from 'react'
import Pattern from '@/utils/components/pattern'
import Navbar from '@/utils/components/navbar'
import Footer from '@/utils/components/footer'
import CardOptions from '@/components/game/CardOptions'
import Horses from '@/components/game/Horses'
import Items from '@/components/game/Items'
import PageContent from '@/utils/components/page-content'
import BreedFarm from '@/components/game/BreedFarm'
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
        <Pattern type="yellow">
          <CardOptions changeView={toogleView} />
        </Pattern>
        {view === 'items' && (
          <Pattern type="brown">
            <Items changeView={toogleView} />
            <Footer copyrightTextColor="white" />
          </Pattern>
        )}
        {view === 'horses' && (
          <Pattern type="light">
            <Horses changeView={toogleView} />
            <Footer copyrightTextColor="white" />
          </Pattern>
        )}
        {view === 'stables' && (
          <Pattern type="brown">
            <Stables changeView={toogleView} />
          </Pattern>
        )}
        {view === 'breeding' && (
          <Pattern type="light">
            <BreedFarm changeView={toogleView} />
            <Footer copyrightTextColor="white" />
          </Pattern>
        )}

      </PageContent>
    </>
  )
}

export default Game
