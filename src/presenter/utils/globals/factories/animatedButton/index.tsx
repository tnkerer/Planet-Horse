import React, { useState } from 'react'

interface Props {
  to: string
  id: string
  inactive: string
  active: string
}

const AnimatedButton: React.FC<Props> = ({
  to,
  id,
  inactive,
  active
}) => {
  const [state, setState] = useState(true)

  return (
    <>
      <button
        id={id}
        className={active}
        onMouseLeave={() => {
          setState(true)
        }}
      />
      <button
        id={id}
        className={inactive}
        onMouseOver={() => {
          setState(false)
        }}
        style={{
          display: state ? 'block' : 'none'
        }}
      />
    </>
  )
}

export default AnimatedButton
