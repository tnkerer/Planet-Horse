// ui/volumeSlider.ts
import Phaser from 'phaser';
import { COLORS, VOLUME_SLIDER } from '../utils/constants';

export type SliderRefs = {
  root: Phaser.GameObjects.Container;
  railG: Phaser.GameObjects.Graphics;
  fillG: Phaser.GameObjects.Graphics;
  hit: Phaser.GameObjects.Rectangle;
  thumb: Phaser.GameObjects.Arc;
  thumbShadow: Phaser.GameObjects.Arc;
  railW: number;
  railH: number;
  value: number;
};

export function createVolumeSlider(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer, initialV = 0.6): SliderRefs {
  const root = scene.add.container(0, 0).setDepth(1000);

  const railG = scene.add.graphics().setDepth(1000);
  const fillG = scene.add.graphics().setDepth(1001);
  const hit   = scene.add.rectangle(0, 0, 200, 24, 0, 0).setOrigin(1, 0.5).setDepth(1002).setInteractive({ useHandCursor: true });

  const thumbShadow = scene.add.circle(0, 0, 9, 0x000000, 0.25).setDepth(1002);
  const thumb       = scene.add.circle(0, 0, 8, 0xffffff, 1).setDepth(1003).setStrokeStyle(2, COLORS.trackBorder);

  root.add([railG, fillG, hit, thumbShadow, thumb]);
  uiLayer.add(root);

  return { root, railG, fillG, hit, thumb, thumbShadow, railW: 160, railH: VOLUME_SLIDER.height, value: initialV };
}

export function layoutSlider(scene: Phaser.Scene, s: SliderRefs, rightX: number, centerY: number, canvasW: number) {
  const show = canvasW >= 520;
  s.root.setVisible(show);
  if (!show) return;

  s.railH = VOLUME_SLIDER.height;
  s.railW = Phaser.Math.Clamp(Math.round(canvasW * 0.1), VOLUME_SLIDER.minW, VOLUME_SLIDER.maxW);

  s.root.setPosition(rightX - VOLUME_SLIDER.rightGapFromToggle, centerY);

  s.hit.setSize(s.railW + VOLUME_SLIDER.touchPad, Math.max(24, s.railH + 18));
  s.hit.setOrigin(1, 0.5);
  s.hit.setPosition(0, 0);

  drawRails(s);
  drawFill(s, s.value);
  positionThumb(s);
}

export function drawRails(s: SliderRefs) {
  s.railG.clear();
  s.railG.lineStyle(2, COLORS.trackBorder, 1);
  s.railG.fillStyle(COLORS.rail, 1);
  roundedRectPath(s.railG, -s.railW, 0, s.railW, s.railH, Math.min(6, s.railH / 2));
  s.railG.fillPath();
  s.railG.strokePath();
}

export function drawFill(s: SliderRefs, t: number) {
  const filled = Math.round(s.railW * Phaser.Math.Clamp(t, 0, 1));
  s.fillG.clear();
  if (filled <= 0) return;
  s.fillG.fillStyle(COLORS.trackFill, 1);
  roundedRectPath(s.fillG, -s.railW, 0, filled, s.railH, Math.min(6, s.railH / 2), true);
  s.fillG.fillPath();
}

export function positionThumb(s: SliderRefs) {
  const filled = Math.round(s.railW * s.value);
  const tx = -s.railW + filled; const ty = 0;
  s.thumbShadow.setPosition(tx + 1.5, ty + 1.5);
  s.thumb.setPosition(tx, ty);
}

export function pointerToValue(s: SliderRefs, p: Phaser.Input.Pointer) {
  const sp = s.root.pointToContainer({ x: p.x, y: p.y }) as Phaser.Math.Vector2;
  const localX = Phaser.Math.Clamp(sp.x, -s.railW, 0);
  return 1 - ((-localX) / s.railW);
}

export function setSliderValue(s: SliderRefs, v: number) {
  s.value = Phaser.Math.Clamp(v, 0, 1);
  drawFill(s, s.value);
  positionThumb(s);
}

function roundedRectPath(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, rightRounded = true) {
  const rr = Math.min(r, h / 2, Math.abs(w) / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + w - (rightRounded ? rr : 0), y);
  if (rightRounded) g.arc(x + w - rr, y + rr, rr, -Math.PI / 2, 0);
  else g.lineTo(x + w, y);
  g.lineTo(x + w, y + h - (rightRounded ? rr : 0));
  if (rightRounded) g.arc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2);
  else g.lineTo(x + w, y + h);
  g.lineTo(x + rr, y + h);
  g.arc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI);
  g.lineTo(x, y + rr);
  g.arc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5);
  g.closePath();
}
