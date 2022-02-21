import React from 'react'
import Navbar from '@/utils/components/navbar'
import Banner from '@/components/game/banner'
import Board from '@/components/game/board'
import Pattern from '@/utils/components/pattern'
import About from '@/components/game/about'

function Game () {
  return (
    <>
      <Navbar />
      <Banner />
      <Board />
      <Pattern type='white'>
        <About />
      </Pattern>
    </>
  )
}

export default Game
