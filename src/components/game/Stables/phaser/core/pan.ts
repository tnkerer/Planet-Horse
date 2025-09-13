// core/pan.ts
import Phaser from 'phaser';

// Reuse your BgState from background.ts (has { w, h })
export type PanState = { enabled: boolean; active: boolean; lastX: number; lastY: number };

export function enablePan(
  scene: Phaser.Scene,
  state: PanState,
  worldSize: { w: number; h: number } // <- pass bg here
) {
  const onDown = (p: Phaser.Input.Pointer) => {
    state.active = true; state.lastX = p.x; state.lastY = p.y;
  };

  const onUp = () => { state.active = false; };

  const onMove = (p: Phaser.Input.Pointer) => {
    if (!state.active || !state.enabled || !p.isDown) return;

    const cam = scene.cameras.main;

    // move camera by screen delta adjusted by zoom
    cam.scrollX -= (p.x - state.lastX) / cam.zoom;
    cam.scrollY -= (p.y - state.lastY) / cam.zoom;

    // clamp using world size (background) minus visible viewport
    const viewW = cam.worldView.width;
    const viewH = cam.worldView.height;

    const maxScrollX = Math.max(0, worldSize.w - viewW);
    const maxScrollY = Math.max(0, worldSize.h - viewH);

    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, maxScrollX);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, maxScrollY);

    state.lastX = p.x; state.lastY = p.y;
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onUp);
  scene.input.on('pointerupoutside', onUp);
  scene.input.on('pointermove', onMove);

  return () => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onUp);
    scene.input.off('pointerupoutside', onUp);
    scene.input.off('pointermove', onMove);
  };
}
