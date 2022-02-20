import React, { useState } from 'react'
import Router from 'next/router'

interface Props {
  to: string
  id: string
  inactive: string
  active: string
  click?: string
}

const AnimatedButton: React.FC<Props> = ({
  to,
  id,
  inactive,
  active,
  click
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
            Router.push(to)
          }}
        />
        : <button
          id={id}
          className={onMouseDownUp ? click : active}
          onMouseLeave={() => {
            setOnMouseLeaveOver(true)
          }}
          onClick={() => {
            Router.push(to)
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

export default AnimatedButton
