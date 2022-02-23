import React from 'react'
import Navbar from '@/utils/components/navbar'
import Banner from '@/components/home/banner'
import Board from '@/components/home/board'
import About from '@/components/home/about'
import Pattern from '@/utils/components/pattern'
import BlackHorseWarning from '@/components/home/black-horse-warning'
import Options from '@/components/home/options'
import Footer from '@/components/home/footer'

function Home () {
  return (
    <>
      <Navbar />
      <Banner />
      <Board />
      <Pattern type='white'>
        <About />
        <BlackHorseWarning />
        <Options />
        <Footer copyrightTextColor='black' />
      </Pattern>
    </>
  )
}

export default Home
