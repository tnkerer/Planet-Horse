import React from 'react'
import Landpage from './landpage'
import Gameplay from './landpage/components/Gameplay'
import Pattern from './utils/factories/pattern'

function App () {
  return (
    <>
      <Landpage />
      <Pattern type='light'>
        <Gameplay />
      </Pattern>
    </>
  )
}

export default App
