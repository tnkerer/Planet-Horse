import React from 'react'
import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import Gameplay from '@/components/landpage/gameplay'
import Token from '@/components/landpage/token'
import Partners from '@/components/landpage/partners'
import Footer from '@/components/landpage/footer'

function App () {
  return (
    <>
      <Presentation />
      <Milestones />
      <Gameplay />
      <Token />
      <Partners />
      <Footer />
    </>
  )
}

export default App
