import { useState, useEffect, MutableRefObject } from 'react'

export const useIsVisble = (ref: MutableRefObject<undefined>) => {
  const [isVisbile, setIsVisble] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const { isIntersecting } = entries[0]
      isIntersecting && setIsVisble(isIntersecting)
    })
    observer.observe(ref.current)
  }, [])

  return isVisbile
}
