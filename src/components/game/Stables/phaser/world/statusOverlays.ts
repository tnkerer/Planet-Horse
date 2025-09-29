// src/components/game/Stables/phaser/world/statusOverlays.ts
import Phaser from 'phaser';

// === Spritesheets (64x64) ===
const SLEEPY_SHEET_KEY = 'status-sleepy-sheet';
const SLEEPY_SHEET_URL = '/assets/game/breeding/sleepy-spritesheet.png';
const SLEEPY_ANIM_KEY = 'status-sleepy-loop';

const HURT_SHEET_KEY = 'status-hurt-sheet';
const HURT_SHEET_URL = '/assets/game/breeding/hurt-spritesheet.png';
const HURT_ANIM_KEY = 'status-hurt-loop';

const BREEDING_SHEET_KEY = 'status-breeding-sheet';
const BREEDING_SHEET_URL = '/assets/game/breeding/breeding-spritesheet.png';
const BREEDING_ANIM_KEY = 'status-breeding-loop';

export type OverlayKind = 'sleep' | 'hurt' | 'breeding';

export function mapStatusToOverlay(status: string): OverlayKind | null {
  const s = (status ?? '').toUpperCase();
  if (s === 'SLEEP') return 'sleep';
  if (s === 'BRUISED') return 'hurt';
  if (s === 'BREEDING') return 'breeding';
  return null;
}

/** Load overlay spritesheets & create looping animations (idempotent). */
export async function ensureStatusOverlayAssets(scene: Phaser.Scene) {
  let queued = 0;
  if (!scene.textures.exists(SLEEPY_SHEET_KEY)) {
    scene.load.spritesheet(SLEEPY_SHEET_KEY, SLEEPY_SHEET_URL, { frameWidth: 64, frameHeight: 64 });
    queued++;
  }
  if (!scene.textures.exists(HURT_SHEET_KEY)) {
    scene.load.spritesheet(HURT_SHEET_KEY, HURT_SHEET_URL, { frameWidth: 64, frameHeight: 64 });
    queued++;
  }
  if (!scene.textures.exists(BREEDING_SHEET_KEY)) {
    scene.load.spritesheet(BREEDING_SHEET_KEY, BREEDING_SHEET_URL, { frameWidth: 64, frameHeight: 64 });
    queued++;
  }
  if (queued > 0) {
    await new Promise<void>(resolve => {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      scene.load.start();
    });
  }

  if (!scene.anims.exists(SLEEPY_ANIM_KEY)) {
    scene.anims.create({
      key: SLEEPY_ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(SLEEPY_SHEET_KEY, {}), // all frames
      frameRate: 8,
      repeat: -1,
    });
  }
  if (!scene.anims.exists(HURT_ANIM_KEY)) {
    scene.anims.create({
      key: HURT_ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(HURT_SHEET_KEY, {}),
      frameRate: 10,
      repeat: -1,
    });
  }
  if (!scene.anims.exists(BREEDING_ANIM_KEY)) {
    scene.anims.create({
      key: BREEDING_ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(BREEDING_SHEET_KEY, {}),
      frameRate: 10,
      repeat: -1,
    });
  }
}

export function clearStatusOverlay(spr: Phaser.GameObjects.Sprite) {
  const prev = spr.getData('statusOverlay') as Phaser.GameObjects.Sprite | null;
  if (prev) prev.destroy();
  spr.setData('statusOverlay', null);
  spr.setData('statusOverlayKind', null);
}

/**
 * Create/replace the overlay for the given status (or remove if none).
 * @param targetHeightPx Visible target height for the overlay (e.g. 64)
 */
export function applyStatusOverlay(
  scene: Phaser.Scene,
  worldLayer: Phaser.GameObjects.Layer,
  spr: Phaser.GameObjects.Sprite,
  status: string,
  baseDepth: number,
  targetHeightPx: number
) {
  const desired = mapStatusToOverlay(status);

  const prev = spr.getData('statusOverlay') as Phaser.GameObjects.Sprite | null;
  const prevKind = spr.getData('statusOverlayKind') as OverlayKind | null;

  if (!desired) {
    clearStatusOverlay(spr);
    return;
  }

  // Keep existing overlay if kind matches; just reposition/flip/depth
  if (prev && prevKind === desired) {
    prev
      .setPosition(spr.x, spr.y)
      .setDepth(baseDepth + 1)
      .setFlipX(desired === 'sleep' ? !spr.flipX : spr.flipX);
    return;
  }

  if (prev) prev.destroy();

  const overlayScale = targetHeightPx / 64;

  const key =
    desired === 'sleep' ? SLEEPY_SHEET_KEY :
    desired === 'hurt' ? HURT_SHEET_KEY :
    BREEDING_SHEET_KEY;

  const anim =
    desired === 'sleep' ? SLEEPY_ANIM_KEY :
    desired === 'hurt' ? HURT_ANIM_KEY :
    BREEDING_ANIM_KEY;

  const overlay = scene.add
    .sprite(spr.x, spr.y, key, 0)
    .setOrigin(0.5, 1)
    .setScale(overlayScale)
    .setFlipX(desired === 'sleep' ? !spr.flipX : spr.flipX)
    .setDepth(baseDepth + 1)
    .play(anim);

  worldLayer.add(overlay);

  spr.setData('statusOverlay', overlay);
  spr.setData('statusOverlayKind', desired);

  spr.once(Phaser.GameObjects.Events.DESTROY, () => {
    try { overlay.destroy(); } catch {}
  });
}
