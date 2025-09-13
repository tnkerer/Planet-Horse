import Phaser from 'phaser';

/** Below this width we treat the layout as “mobile landscape” */
export const MOBILE_BREAKPOINT = 920;

/** Virtual sizes you design to (world units). Keep landscape in both. */
export const VIRTUAL_DESKTOP = { width: 1280, height: 720 }; // 16:9
export const VIRTUAL_MOBILE  = { width: 1280, height: 800 }; // ~16:10 (a bit taller)

/** Figure out which virtual size to use given the current canvas size. */
export function getVirtualDims(scale: Phaser.Scale.ScaleManager) {
  const isMobile = scale.width < MOBILE_BREAKPOINT;
  return {
    isMobile,
    virt: isMobile ? VIRTUAL_MOBILE : VIRTUAL_DESKTOP,
  };
}

/**
 * Sets a camera zoom so the chosen virtual rect fits entirely inside the
 * actual canvas (no letterboxing), preserving aspect ratio.
 * Returns { zoom, isMobile, virt }.
 */
export function applyResponsiveViewport(scene: Phaser.Scene) {
  const sc = scene.scale;
  const cam = scene.cameras.main;
  const { isMobile, virt } = getVirtualDims(sc);

  // Save a flag for other systems if you want
  (scene.game as any).__isMobile = isMobile;

  // Zoom so the whole virtual rect is visible
  const zx = sc.width / virt.width;
  const zy = sc.height / virt.height;
  const zoom = Math.min(zx, zy); // show entire virtual area
  cam.setZoom(zoom);

  // Keep current scroll; callers usually clamp after setting world bounds
  cam.setScroll(cam.scrollX, cam.scrollY);

  return { zoom, isMobile, virt };
}
