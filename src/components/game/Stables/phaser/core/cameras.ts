// core/cameras.ts
import Phaser from 'phaser';

export function createUICamera(scene: Phaser.Scene) {
  const uiCam = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height);
  uiCam.setName('ui').setZoom(1).setScroll(0, 0);
  return uiCam;
}

export function wireCameraIgnores(scene: Phaser.Scene, uiCam: Phaser.Cameras.Scene2D.Camera, worldLayer: Phaser.GameObjects.Layer, uiLayer: Phaser.GameObjects.Layer) {
  scene.cameras.main.ignore(uiLayer);
  uiCam.ignore(worldLayer);
}

export function resizeUICamera(uiCam: Phaser.Cameras.Scene2D.Camera, width: number, height: number) {
  uiCam.setSize(width, height);
}
