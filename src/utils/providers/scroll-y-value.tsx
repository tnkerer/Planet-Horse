import React, { useState, Dispatch, SetStateAction } from 'react'

export type scrollYValueContextType = {
  scrollY: number
  setScrollY: Dispatch<SetStateAction<number>>
}

export const ScrollYValueContext = React.createContext<scrollYValueContextType>({
  scrollY: 0,
  setScrollY: text => console.warn('no scroll set')
})

export const ScrollYValueProvider: React.FC = ({ children }) => {
  const [scrollY, setScrollY] = useState(0)

  return (
    <ScrollYValueContext.Provider value={{ scrollY, setScrollY }}>
      {children}
    </ScrollYValueContext.Provider>
  )
}