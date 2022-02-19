import React from 'react'
import Card from '@/presenter/utils/landpage/factories/card'
import styles from './styles.module.scss'
import racingDemoGameplay from '@/assets/landing-page/game-demo/racing.gif'
import barnDemoGameplay from '@/assets/landing-page/game-demo/barn.gif'
import upgradeDemoGameplay from '@/assets/landing-page/game-demo/upgrade.gif'

const Gameplay: React.FC = () => {
  return (
    <div className={styles.container}>
      <span>GAMEPLAY</span>
      <Card
        image={racingDemoGameplay}
        infoFirstParagraph='Race mode offers PvP or PvC racing.'
        infoSecondParagraph='The rewards for the winners will be: experience points, materials, items, tokens.'
      />
      <Card
        image={barnDemoGameplay}
        reverse={true}
        infoFirstParagraph='In the market, players can buy/sell horses, materials, items, stables. '
        infoSecondParagraph='Players will spend/earn PlanetHorse token when trading on the market.'
      />
       <Card
        image={upgradeDemoGameplay}
        infoFirstParagraph='When your horse gains enough experience points, you can use items to upgrade them. '
        infoSecondParagraph='Horse upgrade will increase: speed, sprint, susten, power.'
      />
    </div>
  )
}

export default Gameplay
