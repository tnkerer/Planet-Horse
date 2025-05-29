import React from 'react'
import '../styles/globals.scss'
import { WalletProvider } from '@/contexts/WalletContext'
import { UserProvider } from '@/contexts/UserContext'

function MyApp({ Component, pageProps }) {
  return (
    <WalletProvider>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </WalletProvider>
  )
}

export default MyApp
