import React from 'react'

import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import Gameplay from '@/components/landpage/gameplay'
import Token from '@/components/landpage/token'
import Partners from '@/components/landpage/partners'
import Footer from '@/components/landpage/footer'

import styles from '@/styles/landpage.module.scss'

function App () {
  return (
    <>
      <main className={styles.wrapper}>
        <Presentation />
        <Milestones />
        <Gameplay />
        <Token />
        <Partners />
      </main>
      <Footer />
    </>
  )
}

export default App
