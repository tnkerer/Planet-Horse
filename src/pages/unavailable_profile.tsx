import React, { useEffect, useState } from 'react'
import Pattern from '@/utils/components/pattern'
import Papers from '@/components/profile/papers'
import Navbar from '@/utils/components/navbar'
import PageContent from '@/utils/components/page-content'
import Horseware from '@/components/profile/horseware'
import Footer from '@/utils/components/footer'
import MessageFromMom from '@/components/profile/messageFromMom'
import { useMediaQuery } from 'react-responsive'

const Profile: React.FC = () => {
  const [isWide, setIsWide] = useState(false)

  useEffect(() => {
    setIsWide(window.matchMedia('(min-width:1120px)').matches)
    const mql = window.matchMedia('(min-width:1120px)')
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches)
    mql.addListener(handler)
    return () => mql.removeListener(handler)
  }, [])
  return (
    <>
      <Navbar />
      <PageContent>
        <Pattern type='light'>
          <Papers />
        </Pattern>
        <Pattern type="blurredDarkBlue">
          {isWide && <Horseware />}
          <Footer copyrightTextColor="#fff" />
          {isWide && <MessageFromMom />}
        </Pattern>
      </PageContent>
    </>
  )
}

export default Profile
