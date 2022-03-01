import React from 'react'
import Navbar from '@/utils/components/navbar'
import Banner from '@/components/home/banner'
import Board from '@/components/home/board'
import About from '@/components/home/about'
import Pattern from '@/utils/components/pattern'
import BlackHorseWarning from '@/components/home/black-horse-warning'
import Options from '@/components/home/options'
import Footer from '@/utils/components/footer'
import PageContent from '@/utils/components/page-content'
import { ScrollYValueProvider } from '@/utils/providers/scroll-y-value'
import SetterScrollYValue from '@/utils/components/setter-scrollY-value'

function Home () {
  return (
    <>
      <ScrollYValueProvider>
        <SetterScrollYValue />
        <Navbar />
        <PageContent>
          <Banner />
          <Board />
          <Pattern type='white'>
            <About />
            <BlackHorseWarning scrollValueToAnimate={400} />
            <Options />
            <Footer copyrightTextColor='#000' />
          </Pattern>
        </PageContent>
      </ScrollYValueProvider>
    </>
  )
}

export default Home
