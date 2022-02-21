import React from 'react'
import Footer from '../components/pre-sale/Footer'
import Pattern from '../presenter/utils/landpage/factories/pattern'
import Lousa from '../components/pre-sale/Lousa'
import Navbar from 'presenter/game/components/Navbar'

const Game: React.FC = () => {
  return (
    <>
    <Navbar />
    <Pattern type='azul-quadrado'>
      <Lousa />
      <Footer colorLetter='white' />
    </Pattern>
    </>
  )
}

export default Game
