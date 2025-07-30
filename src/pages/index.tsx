import React, { useEffect } from 'react'

import Presentation from '@/components/landpage/presentation'
import Milestones from '@/components/landpage/milestones'
import GamePlay from '@/components/landpage/gameplay'
import Token from '@/components/landpage/token'
import Partners from '@/components/landpage/partners'
import Footer from '@/components/landpage/footer'

import styles from '@/styles/landpage.module.scss'

const App: React.FC = () => {

  useEffect(() => {
    // Parse the query parameters
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')

    if (ref) {
      // Save in cookies
      document.cookie = `ref=${ref}; path=/; max-age=${60 * 60 * 24 * 30}` // expires in 30 days
    }
  }, [])

  return (
    <>
      <main className={styles.wrapper}>
        <Presentation />
        <Milestones />
        <GamePlay />
        <Token />
        <Partners />
      </main>
      <Footer />
    </>
  )
}

export default App
