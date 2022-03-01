import React from 'react'
import Pattern from '@/utils/components/pattern'
import Papers from '@/components/profile/papers'
import Navbar from '@/utils/components/navbar'
import PageContent from '@/utils/components/page-content'
import Horseware from '@/components/profile/horseware'
import Footer from '@/utils/components/footer'
import MessageFromMom from '@/components/profile/messageFromMom'

const Profile: React.FC = () => {
  return (
    <>
      <Navbar />
      <PageContent>
        <Pattern type='light'>
          <Papers />
        </Pattern>
        <Pattern type='blurredDarkBlue'>
          <Horseware />
          <Footer copyrightTextColor='#fff' />
          <MessageFromMom />
        </Pattern>
      </PageContent>
    </>
  )
}

export default Profile
