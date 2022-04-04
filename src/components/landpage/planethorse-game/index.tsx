import p5 from 'p5'
import React, { useEffect, useRef } from 'react'
import styles from './styles.module.scss'

const PlanetHorseGame: React.FC = () => {
  const divRef = useRef()

  useEffect(() => {
    if (window.p5 && divRef.current) {
      new (window as any).p5((p: p5) => {
        const pos = {
          background: 0,
          foreground: 0
        }

        p.setup = () => {
          p.createCanvas(window.innerWidth, window.innerHeight)
            .parent(divRef.current);
          p.noStroke();
        }

        p.draw = () => {
          p.background(33) 

          pos.foreground = p.map(p.mouseX, 0, p.width, p.width * 0.5 - 333, p.width * 0.5 + 333);
          pos.background = p.map(p.mouseX, 0, p.width, p.width * 0.5 - 133, p.width * 0.5 + 133);

          backgroundShape(pos.background);
          foregroundShape(pos.foreground);
          
          p.rect(50, 100, 55, 55, 20, 15, 10, 5);
          // a square without animation to exemplify
          water();
        }

        function water () {
          p.fill('#13172180');
          p.rect(0, 250, p.width, 200);
        }

        function backgroundShape (pos: number) {
          p.fill('#8877ee');
          p.rect(pos, 100, 100, 250, 250);
        }

        function foregroundShape(pos: number) {
           p.push();
           p.translate(pos,0);
           p.fill('#f8f8f8');
           p.beginShape();
           p.vertex(100, 230);
           p.vertex(74, 269);
           p.vertex(100, 256);
           p.vertex(132, 278);
           p.endShape();
           p.pop();
        }
      })
    }

  }, [])

  return <div className={styles.container} ref={divRef} />
}

export default PlanetHorseGame
