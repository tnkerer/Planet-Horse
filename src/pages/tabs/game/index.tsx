import React from 'react'
import Navbar from '@/utils/components/navbar'
import Banner from '@/components/game/banner'
import Board from '@/components/game/board'
import About from '@/components/game/about'
import Pattern from '@/utils/components/pattern'
import BlackHorseWarning from '@/components/game/black-horse-warning'

function Game () {
  return (
    <>
      <Navbar />
      <Banner />
      <Board />
      <Pattern type='white'>
        <About />
        <BlackHorseWarning />
      </Pattern>
    </>
  )
}

export default Game
