import React from 'react'

const Board: React.FC = () => {
  return (
    <svg width='100%' height='90px'>
      <rect y='14' fill='#7d4d45' width='100%' height='74' /> 
      <rect fill='#c49086' width='100%' height='4' /> 
      <rect y='4' fill='#a26b61' width='100%' height='10' /> 
      <rect y='18' fill='#a26b61' width='100%' height='4' /> 
      <rect y='71' fill='#582c24' width='100%' height='4' /> 
      <rect y='78' fill='#582c24' width='100%' height='9' /> 
      <rect y='87' fill='#401c16' width='100%' height='3' /> 
    </svg>
  )
}

export default Board
