import React from 'react'
import Navbar from '@/utils/components/navbar'
import Pattern from '@/utils/components/pattern'
import Lousa from '@/components/pre-sale/lousa'
import Footer from '@/utils/components/footer'
import Fan from '@/utils/components/fan'

function PreSale () {
  return (
    <>
      <Navbar />
      <Pattern type='blue'>
        <Lousa />
        <Footer copyrightTextColor='#fff' />
        <Fan />
      </Pattern>
    </>
  )
}

export default PreSale
