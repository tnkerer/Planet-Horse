import React from 'react'
import Pattern from '@/utils/components/pattern'
import Navbar from '@/utils/components/navbar'
import Footer from '@/components/game/Footer'
import CardOptions from '@/components/game/CardOptions'
import Horses from '@/components/game/Horses'

const Game: React.FC = () => {
  return (
    <>
      <Navbar />
      <Pattern type="yellow">
        <CardOptions />
      </Pattern>
      <Pattern type="light">
        <Horses />
        <Footer colorLetter="white" />
      </Pattern>
    </>
  )
}

export default Game
