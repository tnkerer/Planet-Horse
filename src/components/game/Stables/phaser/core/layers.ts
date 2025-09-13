// core/layers.ts
import Phaser from 'phaser';

export type Layers = { world: Phaser.GameObjects.Layer; ui: Phaser.GameObjects.Layer; };

export function createLayers(scene: Phaser.Scene): Layers {
  return {
    world: scene.add.layer(),
    ui: scene.add.layer(),
  };
}
