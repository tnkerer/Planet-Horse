// src/components/game/Stables/phaser/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // Load just what's needed to draw the loading screen
    this.load.image('logo', '/assets/game/phaser/misc/logo.gif');
    this.load.image('hud-interface', '/assets/game/phaser/ui/interface.png');
    this.load.image('hud-avatar', '/assets/game/phaser/ui/horse.gif');
    this.load.image('icon-phorse', '/assets/game/phaser/ui/coin.webp');
    this.load.image('icon-wron', '/assets/game/phaser/ui/wron.webp');
    this.load.image('icon-shard', '/assets/game/phaser/ui/shard.gif');
    this.load.image('icon-medal', '/assets/game/phaser/ui/medal.gif');
  }

  create() {
    this.scene.start('Loading');
  }
}
