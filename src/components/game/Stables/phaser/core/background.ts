// core/background.ts
import Phaser from 'phaser';
import { VIRTUAL_DESKTOP, VIRTUAL_MOBILE } from '../utils/viewport';

export type BgState = { img: Phaser.GameObjects.Image; w: number; h: number; };

export function createBackground(scene: Phaser.Scene, worldLayer: Phaser.GameObjects.Layer): BgState {
  const img = scene.add.image(0, 0, 'bg').setOrigin(0, 0).setDepth(-100);
  worldLayer.add(img);
  return { img, w: 0, h: 0 };
}

export function fitBackgroundToCover(scene: Phaser.Scene, bg: BgState) {
  const cam = scene.cameras.main;
  const isMobile = (scene.game as any).__isMobile as boolean;
  const target = isMobile ? VIRTUAL_MOBILE : VIRTUAL_DESKTOP;

  const tex = scene.textures.get('bg').getSourceImage() as HTMLImageElement;
  const iw = tex.width; const ih = tex.height;

  const scale = Math.max(target.width / iw, target.height / ih);
  bg.w = Math.ceil(iw * scale); bg.h = Math.ceil(ih * scale);
  bg.img.setDisplaySize(bg.w, bg.h);

  cam.setBounds(0, 0, bg.w, bg.h);

  const viewW = cam.worldView.width;
  const viewH = cam.worldView.height;
  if (bg.w <= viewW && bg.h <= viewH) {
    cam.setScroll((bg.w - viewW) * 0.5, (bg.h - viewH) * 0.5);
    return false; // pan disabled
  } else {
    cam.setScroll(
      Phaser.Math.Clamp(cam.scrollX, 0, Math.max(0, bg.w - viewW)),
      Phaser.Math.Clamp(cam.scrollY, 0, Math.max(0, bg.h - viewH)),
    );
    return true; // pan enabled
  }
}
