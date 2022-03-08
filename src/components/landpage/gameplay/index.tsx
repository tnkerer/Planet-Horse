import React, { useState, useEffect, useContext } from 'react'
import styles from './styles.module.scss'
import racingDemoGameplay from '@/assets/landing-page/gameplay/racing.gif'
import barnDemoGameplay from '@/assets/landing-page/gameplay/barn.gif'
import upgradeDemoGameplay from '@/assets/landing-page/gameplay/upgrade.gif'
import Card from '../card'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'
import AnimateElement from '@/utils/class/animate-element'

const Gameplay: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    const animateElement = new AnimateElement()
    const scrollTargetValue = 90
    const screenWidthResolution = window.innerWidth
    const showElement = animateElement.showElement(scrollY, scrollTargetValue, screenWidthResolution)
    showElement && setScrolled(true)
  }, [scrollY])

  return (
    <div className={styles.container}>
      <span style={{
        opacity: scrolled ? 1 : 0
      }}>GAMEPLAY</span>
      <Card
        image={racingDemoGameplay}
        scrollValueToAnimate={200}
        infoFirstParagraph='Race mode offers PvP or PvC racing.'
        infoSecondParagraph='The rewards for the winners will be: points, materials, items and tokens.'
      />
      <Card
        image={barnDemoGameplay}
        scrollValueToAnimate={600}
        reverse={true}
        infoFirstParagraph='In the market, players can buy/sell horses, materials, items and stables. '
        infoSecondParagraph='Players will spend/earn PlanetHorse token when trading on the market.'
      />
       <Card
        image={upgradeDemoGameplay}
        scrollValueToAnimate={1000}
        infoFirstParagraph='You can pay in PHORSE currency to upgrade your horse and increase your win rates and earn more.'
        infoSecondParagraph='Horse upgrade will increase: speed, sprint, susten and power.'
      />
    </div>
  )
}

export default Gameplay
