import React from 'react'
import Navbar from '@/utils/components/navbar'
import Pattern from '@/utils/components/pattern'
// import Lousa from '@/components/pre-sale/lousa'
import Footer from '@/components/pre-sale/footer'

function PreSale () {
  return (
    <>
      <Navbar />
      <Pattern type='azul-quadrado'>
        {/* <Lousa /> */}
        <Footer colorLetter='white' />
      </Pattern>
    </>
  )
}

export default PreSale
