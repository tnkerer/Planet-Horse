import MataMaskProvider from '@/utils/providers/metamask-provider'
import React from 'react'
import '../styles/globals.scss'

function MyApp ({ Component, pageProps }) {
  return (
    <MataMaskProvider>
      <Component {...pageProps} />
    </MataMaskProvider>
  )
}

export default MyApp
