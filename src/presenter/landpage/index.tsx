import React from 'react'
import Pattern from '../utils/factories/pattern'
import Banner from './components/Banner'
import Gameplay from './components/Gameplay'
import NFTHorses from './components/NFTHorses'
import WhitePaper from './components/WhitePaper'
import Token from './components/Token'
import Team from './components/Team'
import Blackboard from './components/Blackboard'

const Landpage: React.FC = () => {
  return (
    <>
      <Banner />
      <Pattern type='light'>
        <Gameplay />
        <NFTHorses />
      </Pattern>
      <Pattern type='dark'>
        <WhitePaper />
        <Token />
        <Team />
      </Pattern>
      <Blackboard />
    </>
  )
}

export default Landpage
