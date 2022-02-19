import React from 'react'
import Pattern from '../utils/factories/pattern'
import Banner from './components/Banner'
import Gameplay from './components/Gameplay'
import NFTHorses from './components/NFTHorses'
import WhitePaper from './components/WhitePaper'

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
      </Pattern>
    </>
  )
}

export default Landpage
