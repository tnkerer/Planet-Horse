import React from 'react'
import Navbar from '@/utils/components/navbar'
import Banner from '@/components/game/banner'
import Board from '@/components/game/board'
import About from '@/components/game/about'
import Pattern from '@/utils/components/pattern'
import BlackHorseWarning from '@/components/game/black-horse-warning'
import Options from '@/components/game/options'
import Footer from '@/components/game/footer'

function Game () {
  return (
    <>
      <Navbar />
      <Banner />
      <Board />
      <Pattern type='white'>
        <About />
        <BlackHorseWarning />
        <Options />
        <Footer />
      </Pattern>
    </>
  )
}

export default Game
