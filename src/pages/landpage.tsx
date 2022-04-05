import React from 'react'
import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import Gameplay from '@/components/landpage/gameplay'
import Token from '@/components/landpage/token'
import Team from '@/components/landpage/team'
import Footer from '@/components/landpage/footer'
import SocialMidia from '@/components/landpage/social-midia'

function App () {
  return (
    <>
      <Presentation />
      <Milestones />
      <Gameplay />
      <Token />
      <Team />
      <Footer />
      <SocialMidia />
    </>
  )
}

export default App
