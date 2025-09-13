import Phaser from 'phaser';
import type { Horse } from '../../types/horse';

// === CONFIG you can tweak ===
const FRAME_W = 48;             // set to the per-frame size you exported (48/64/96…)
const FRAME_H = 48;
const FPS_RUN = 10;            // animation speed
const TARGET_H = 64;           // display height in pixels (scaled up/down)
const MIRROR_CHANCE = 0.5;      // 50% chance to flipX
const MARGIN = 40;              // inner margin inside safe area
// --- Shadow config (48x48 like horses) ---
const SHADOW_SHEET_URL = '/assets/game/breeding/shadow-spritesheet.png';
const SHADOW_SHEET_KEY = 'horse-shadow-sheet';
const SHADOW_ANIM_KEY = 'horse-shadow-run';


// Tooltip (label/value) -------------------------------------------------------
type TooltipRow = { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text };
type TooltipRefs = { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle; rows: TooltipRow[] };

// === Safe zones in *source image* coordinates (unscaled) ===
type SrcRect = { x1: number; y1: number; x2: number; y2: number };
const SAFE_RECTS_SRC: SrcRect[] = [
  { x1: 1552, y1: 20, x2: 1984, y2: 744 }, // (1552,744) (1552,20) (1984,20) (1984,744)
  { x1: 924, y1: 560, x2: 1552, y2: 760 }, // (924,760) (924,560) (1552,560) (1552,760)
  { x1: 20, y1: 20, x2: 500, y2: 500 }, // (20,500) (500,500) (500,20) (20,20)
  { x1: 20, y1: 800, x2: 900, y2: 1100 },// (20,1100) (20,800) (900,800) (900,1100)
];

type WorldRect = { xMin: number; xMax: number; yMin: number; yMax: number };

// Scale the source-space rects to current world-space (bgW × bgH)
function getScaledSafeRects(scene: Phaser.Scene, worldW: number, worldH: number, bgTextureKey = 'bg'): WorldRect[] {
  const texImg = scene.textures.get(bgTextureKey).getSourceImage() as HTMLImageElement;
  const srcW = texImg.width;
  const srcH = texImg.height;
  const sx = worldW / srcW;
  const sy = worldH / srcH; // cover uses uniform scale, but we keep both for robustness

  return SAFE_RECTS_SRC.map(({ x1, y1, x2, y2 }) => {
    const xMin = Math.min(x1, x2) * sx;
    const xMax = Math.max(x1, x2) * sx;
    const yMin = Math.min(y1, y2) * sy;
    const yMax = Math.max(y1, y2) * sy;
    return { xMin, xMax, yMin, yMax };
  });
}

function createTooltip(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer): TooltipRefs {
  const root = scene.add.container(0, 0).setDepth(2000).setVisible(false);
  const bg = scene.add.rectangle(0, 0, 10, 10, 0x95AEDB, 0.9).setStrokeStyle(1, 0x3e3631).setOrigin(0, 0);
  const mkText = (color = '#000') => scene.add.text(0, 0, '', { fontFamily: 'SpaceHorse, sans-serif', fontSize: '14px', color });
  const rows: TooltipRow[] = Array.from({ length: 9 }).map(() => ({ label: mkText('#583400'), value: mkText('#000000') }));
  root.add([bg, ...rows.flatMap(r => [r.label, r.value])]); uiLayer.add(root);
  return { root, bg, rows };
}
function showTooltip(t: TooltipRefs, h: Horse) {
  const rarityColorMap: Record<string, string> = { common: '#00aa00', uncommon: '#2F35A8', rare: '#800080', epic: '#ff69b4', legendary: '#a78e06', mythic: '#E21C21' };
  const sexColorMap: Record<string, string> = { male: '#2F35A8', female: '#dc207e' };
  const name = (h.profile.nickname?.trim()?.length ? h.profile.nickname : h.profile.name).slice(0, 16);

  const rows: Array<[string, string, string?]> = [
    ['NAME:', name],
    ['SEX:', h.profile.sex, sexColorMap[h.profile.sex.toLowerCase()] ?? '#000000'],
    ['RARITY:', h.profile.type_horse, rarityColorMap[h.profile.type_horse_slug] ?? '#000000'],
    ['GEN:', h.staty.generation],
    ['BREEDS:', (h.staty as any).breeding ?? '0/24'],
    ['STATUS:', h.staty.status],
    ['LEVEL:', h.staty.level],
    ['EXP:', h.staty.exp],
    ['ENERGY:', h.staty.energy],
  ];

  const padX = 8;
  const padY = 6;
  const gap = 2;
  let y = padY;
  let maxW = 0;
  t.rows.forEach((row, i) => {
    const spec = rows[i]; const visible = !!spec;
    row.label.setVisible(visible); row.value.setVisible(visible);
    if (!visible) return;
    const [label, value, vColor] = spec;
    row.label.setText(label); row.value.setText(' ' + value);
    row.value.setColor(vColor ?? '#000000');
    row.label.setPosition(padX, y);
    row.value.setPosition(padX + row.label.width + 6, y);
    const w = (row.value.x + row.value.width) - padX; maxW = Math.max(maxW, w);
    y += Math.max(row.label.height, row.value.height) + gap;
  });
  t.bg.setSize(maxW + padX * 2, y + padY); t.root.setVisible(true);
}
const hideTooltip = (t: TooltipRefs) => t.root.setVisible(false);
function moveTooltip(t: TooltipRefs, screenX: number, screenY: number) {
  const ox = 14;
  const oy = 10;
  const w = t.bg.width;
  const h = t.bg.height;
  let x = screenX + ox;
  let y = screenY - oy - h;
  const sw = window.innerWidth;
  if (x + w > sw - 12) x = sw - 12 - w;
  if (y < 12) y = screenY + oy;
  t.root.setPosition(x, y);
}

// Paths/keys -------------------------------------------------------------------
const sheetUrl = (h: Horse, hovered: boolean) =>
  `/assets/game/breeding/stable-horses/right/${h.profile.type_horse_slug}/${h.profile.name_slug}-${hovered ? 'hover' : 'regular'}-spritesheet.png`;
const sheetKey = (h: Horse, hovered: boolean) => `horse-${h.id}-${hovered ? 'hover' : 'regular'}-sheet`;
const animKey = (h: Horse, hovered: boolean) => `horse-${h.id}-${hovered ? 'hover' : 'regular'}-run`;

// Load the shadow spritesheet once and create its looping animation
export async function ensureShadowAnim(scene: Phaser.Scene) {
  if (!scene.textures.exists(SHADOW_SHEET_KEY)) {
    scene.load.spritesheet(SHADOW_SHEET_KEY, SHADOW_SHEET_URL, {
      frameWidth: 48,   // both horse & shadow are 48×48
      frameHeight: 48,
    });
    await new Promise<void>(resolve => {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      scene.load.start();
    });
  }
  if (!scene.anims.exists(SHADOW_ANIM_KEY)) {
    scene.anims.create({
      key: SHADOW_ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(SHADOW_SHEET_KEY, {}),
      frameRate: FPS_RUN, // reuse your horse FPS so they “feel” synced
      repeat: -1,
    });
  }
}

// Load/anim ensure -------------------------------------------------------------
export async function ensureHorseAnims(scene: Phaser.Scene, list: Horse[]) {
  // queue loads only for missing sheets
  let queued = 0;
  for (const h of list) {
    const kReg = sheetKey(h, false);
    const kHov = sheetKey(h, true);
    if (!scene.textures.exists(kReg)) { scene.load.spritesheet(kReg, sheetUrl(h, false), { frameWidth: FRAME_W, frameHeight: FRAME_H }); queued++; }
    if (!scene.textures.exists(kHov)) { scene.load.spritesheet(kHov, sheetUrl(h, true), { frameWidth: FRAME_W, frameHeight: FRAME_H }); queued++; }
  }
  if (queued > 0) {
    await new Promise<void>(resolve => { scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve()); scene.load.start(); });
  }

  // create animations if missing
  for (const h of list) {
    const kReg = sheetKey(h, false);
    const kHov = sheetKey(h, true);
    const aReg = animKey(h, false);
    const aHov = animKey(h, true);
    if (!scene.anims.exists(aReg)) {
      scene.anims.create({
        key: aReg,
        frames: scene.anims.generateFrameNumbers(kReg, {}),
        frameRate: FPS_RUN,
        repeat: -1,
      });
    }
    if (!scene.anims.exists(aHov)) {
      scene.anims.create({
        key: aHov,
        frames: scene.anims.generateFrameNumbers(kHov, {}),
        frameRate: FPS_RUN,
        repeat: -1,
      });
    }
  }
}

// Spawner with safe area + random mirror --------------------------------------
export function spawnHorsesRandom(
  scene: Phaser.Scene,
  worldLayer: Phaser.GameObjects.Layer,
  uiLayer: Phaser.GameObjects.Layer,
  list: Horse[],
  worldSize: { w: number; h: number },
) {
  const tooltip = createTooltip(scene, uiLayer);
  const sprites: Phaser.GameObjects.Sprite[] = [];

  const rects = getScaledSafeRects(scene, worldSize.w, worldSize.h, 'bg');


  for (const h of list) {
    // Pick a random rect, then a random point inside (with inner margin)
    const r = Phaser.Utils.Array.GetRandom(rects);
    const x = Phaser.Math.Between(Math.ceil(r.xMin + MARGIN), Math.floor(r.xMax - MARGIN));
    const y = Phaser.Math.Between(Math.ceil(r.yMin + MARGIN), Math.floor(r.yMax - MARGIN));

    // Create shadow + horse exactly as you already do (kept here for completeness)
    const spr = scene.add.sprite(x, y, sheetKey(h, false), 0)
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true });

    const scale = TARGET_H / FRAME_H;
    spr.setScale(scale);

    const mirrored = Math.random() < MIRROR_CHANCE;
    spr.setFlipX(mirrored);

    const shadow = scene.add.sprite(x, y, SHADOW_SHEET_KEY, 0)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setFlipX(mirrored)
      .setDepth(spr.depth - 1)
      .play(SHADOW_ANIM_KEY);

    worldLayer.add(shadow);
    worldLayer.add(spr);

    spr.play(animKey(h, false));
    // helper to restart both from frame 0
    const playBoth = (horseAnimKey: string) => {
      // hard restart (ignoreIfPlaying=false), startFrame=0
      spr.play(horseAnimKey, false);
      shadow.play(SHADOW_ANIM_KEY, false);
    };

    // swap & re-sync on hover in/out
    spr.on('pointerover', () => {
      playBoth(animKey(h, true));
      showTooltip(tooltip, h);
    });

    spr.on('pointerout', () => {
      playBoth(animKey(h, false));
      hideTooltip(tooltip);
    });

    // keep moving tooltip
    spr.on('pointermove', (p: Phaser.Input.Pointer) => moveTooltip(tooltip, p.x, p.y));

    sprites.push(spr);
  }

  return { sprites, tooltip };
}
