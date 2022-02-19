import React from 'react'
import Pattern from '../utils/factories/pattern'
import Banner from './components/Banner'
import Gameplay from './components/Gameplay'
import NFTHorses from './components/NFTHorses'

const Landpage: React.FC = () => {
  return (
    <>
      <Banner />
      <Pattern type='light'>
        <Gameplay />
        <NFTHorses />
      </Pattern>
    </>
  )
}

export default Landpage
