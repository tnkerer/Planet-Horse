import React, { useState } from 'react'
import Router from 'next/router'

interface Props {
  to?: string
  id: string
  inactive: string
  active: string
  click?: string
  newTab?: boolean
}

const GraphicalButton: React.FC<Props> = ({
  to,
  id,
  inactive,
  active,
  click,
  newTab = false
}) => {
  const [onMouseLeaveOver, setOnMouseLeaveOver] = useState(true)
  const [onMouseDownUp, setOnMouseDownUp] = useState(false)

  return (
    <>
      {click
        ? <button
          id={id}
          className={onMouseDownUp ? click : active}
          onMouseLeave={() => {
            setOnMouseLeaveOver(true)
          }}
          onMouseUp={() => {
            setOnMouseDownUp(false)
          }}
          onMouseDown={() => {
            setOnMouseDownUp(true)
          }}
          onClick={() => {
            to
              ? Router.push(to)
              : window.scrollTo({
                top: window.innerWidth <= 810 ? 5500 : 3400,
                behavior: 'smooth'
              })
          }}
          style={{
            display: onMouseLeaveOver
              ? 'none'
              : 'block'
          }}
        />
        : <button
          id={id}
          className={onMouseDownUp ? click : active}
          onMouseLeave={() => {
            setOnMouseLeaveOver(true)
          }}
          onClick={() => {
            newTab
              ? window.open(to, '_blank')
              : Router.push(to)
          }}
          style={{
            display: onMouseLeaveOver
              ? 'none'
              : 'block'
          }}
      />}
      <button
        id={id}
        className={inactive}
        onMouseOver={() => {
          setOnMouseLeaveOver(false)
        }}
        style={{
          display: onMouseLeaveOver
            ? 'block'
            : 'none'
        }}
      />
    </>
  )
}

export default GraphicalButton
