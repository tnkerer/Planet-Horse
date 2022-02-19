import React from 'react'
import Landpage from './landpage'
import Gameplay from './landpage/components/Gameplay'
import NFTHorses from './landpage/components/NFTHorses'
import Pattern from './utils/factories/pattern'

function App () {
  return (
    <>
      <Landpage />
      <Pattern type='light'>
        <Gameplay />
        <NFTHorses />
      </Pattern>
    </>
  )
}

export default App
