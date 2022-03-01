import React, { useContext, useEffect } from 'react'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

const SetterScrollYValue: React.FC = () => {
  const { setScrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    window.addEventListener('scroll', function () {
      const setScrollYValue = this.scrollY
      setScrollY(setScrollYValue)
    })
  }, [])

  return <></>
}

export default SetterScrollYValue
