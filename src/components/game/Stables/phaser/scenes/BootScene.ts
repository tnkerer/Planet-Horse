// src/components/game/Stables/phaser/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // Load just what's needed to draw the loading screen
    this.load.image('logo', '/assets/game/phaser/misc/logo.gif');
  }
  
  create() {
    this.scene.start('Loading');
  }
}
