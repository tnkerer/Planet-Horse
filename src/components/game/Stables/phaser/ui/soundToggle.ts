// ui/soundToggle.ts
import Phaser from 'phaser';
import { COLORS } from '../utils/constants';

export type ToggleRefs = { bg: Phaser.GameObjects.Arc; icon: Phaser.GameObjects.Text; };

export function createSoundToggle(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer, onClick: () => void): ToggleRefs {
  const bg = scene.add.circle(0, 0, 18, COLORS.hudBg, 0.45)
    .setOrigin(1, 0).setDepth(1000).setInteractive({ useHandCursor: true });
  const icon = scene.add.text(0, 0, '🔊', { fontSize: '20px', color: '#fff' })
    .setOrigin(0.5).setDepth(1001);

  bg.on('pointerdown', onClick);
  bg.on('pointerover', () => bg.setAlpha(0.6));
  bg.on('pointerout',  () => bg.setAlpha(0.45));

  uiLayer.add([bg, icon]);
  return { bg, icon };
}

export function layoutToggle(refs: ToggleRefs, x: number, y: number) {
  refs.bg.setPosition(x, y);
  refs.icon.setPosition(x - 18, y + 18);
}
