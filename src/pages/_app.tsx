import React from 'react'
import '../styles/globals.scss'
import { WalletProvider } from '@/contexts/WalletContext'
import { UserProvider } from '@/contexts/UserContext'
import CustomCursor from '@/utils/components/custom-cursor'
import { inject } from '@vercel/analytics'

inject()

function MyApp({ Component, pageProps }) {
  return (
    <WalletProvider>
      <UserProvider>
        <CustomCursor />
        <Component {...pageProps} />
      </UserProvider>
    </WalletProvider>
  )
}

export default MyApp
