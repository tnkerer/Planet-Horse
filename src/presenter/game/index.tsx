import React from 'react'
import Banner from './components/Banner'
import Board from './components/Board'
import Navbar from './components/Navbar'

const Game: React.FC = () => {
  return (
    <>
      <Navbar />
      <Banner />
      <Board />
    </>
  )
}

export default Game
