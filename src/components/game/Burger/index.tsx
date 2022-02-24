import { BurgerContext } from '@/presentation/pages/providers/burger'
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import styles from './styles.module.scss'

const Burger: React.FC = () => {
  const { open, setOpen } = useContext(BurgerContext)

  return (
    <div
      className={`
                  ${styles.container}
                  ${open ? styles.open : styles.close}
                `}
    >
      <ul>
        <li>
          <Link
            to={'/home-tab'}
            onClick={() => setOpen(!open)}
          >home</Link>
        </li>
        <li>
          <Link
            to={'#'}
          >
            marketplace
          </Link>
        </li>
        <li>
          <Link
            to={'/game'}
            onClick={() => setOpen(!open)}
          >
            game
          </Link>
        </li>
        <li>
          <Link to={'#'}>staking</Link>
        </li>
        <li>
          <Link to={'#'}>barn</Link>
        </li>
      </ul>
    </div>
  )
}

export default Burger
