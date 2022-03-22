import React, { useState, Dispatch, SetStateAction } from 'react'

export type flipperContextType = {
  flipper: boolean[]
  setFlipper: Dispatch<SetStateAction<boolean[]>>
}

export const FlipperContext = React.createContext<flipperContextType>({
  flipper: Array(8).fill(false),
  setFlipper: text => console.warn('no scroll set')
})

export const FlipperProvider: React.FC = ({ children }) => {
  const [flipper, setFlipper] = useState(Array(8).fill(false))

  return (
    <FlipperContext.Provider value={{ flipper, setFlipper }}>
      {children}
    </FlipperContext.Provider>
  )
}
