import React from 'react'
import Pattern from '@/utils/components/pattern'
import Navbar from '@/utils/components/navbar'
import Footer from '@/utils/components/footer'
import CardOptions from '@/components/game/CardOptions'
import Horses from '@/components/game/Horses'
import PageContent from '@/utils/components/page-content'

const Game: React.FC = () => {
  return (
    <>
      <Navbar />
      <PageContent>
        <Pattern type="yellow">
          <CardOptions />
        </Pattern>
        <Pattern type="light">
          <Horses />
          <Footer copyrightTextColor="white" />
        </Pattern>
      </PageContent>
    </>
  )
}

export default Game
