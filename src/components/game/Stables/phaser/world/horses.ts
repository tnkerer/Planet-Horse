import Phaser from 'phaser';
import type { Horse } from '../../types/horse';


export type Placement = { x: number; y: number; flipX: boolean };


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
  { x1: 1425, y1: 20, x2: 1984, y2: 770 }, // (1552,744) (1552,20) (1984,20) (1984,744)
  { x1: 1675, y1: 770, x2: 1984, y2: 1104 },
  { x1: 1125, y1: 770, x2: 1495, y2: 1104 }, // (924,760) (924,560) (1552,560) (1552,760)
  { x1: 20, y1: 20, x2: 500, y2: 500 }, // (20,500) (500,500) (500,20) (20,20)
  { x1: 20, y1: 500, x2: 300, y2: 800 },
  { x1: 970, y1: 20, x2: 1190, y2: 450 },
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
  const scene = t.root.scene;

  // Canvas (render) bounds in game coordinates (not window pixels)
  const sw = scene.scale.width;
  const sh = scene.scale.height;

  const pad = 12;     // keep a small margin from canvas edges
  const ox = 14;      // cursor horizontal offset
  const oy = 10;      // cursor vertical offset
  const w = t.bg.width;
  const h = t.bg.height;

  // Try the default placement: to the RIGHT of the cursor, above if possible
  let x = screenX + ox;
  let y = screenY - oy - h;

  // If it would overflow on the RIGHT, flip to the LEFT of the cursor
  if (x + w > sw - pad) {
    x = screenX - ox - w;
  }

  // If above would overflow on the TOP, place it BELOW the cursor
  if (y < pad) {
    y = screenY + oy;
  }

  // Final clamps so it never leaks outside the canvas
  if (x < pad) x = pad;
  if (x + w > sw - pad) x = sw - pad - w;
  if (y < pad) y = pad;
  if (y + h > sh - pad) y = sh - pad - h;

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
function rectArea(r: WorldRect) {
  return Math.max(0, r.xMax - r.xMin) * Math.max(0, r.yMax - r.yMin);
}
function pickPointInRect(rng: Phaser.Math.RandomDataGenerator, r: WorldRect, margin: number) {
  const x = Math.floor(rng.between(r.xMin + margin, r.xMax - margin));
  const y = Math.floor(rng.between(r.yMin + margin, r.yMax - margin));
  return { x, y };
}
function pickRectWeighted(rng: Phaser.Math.RandomDataGenerator, rects: WorldRect[]) {
  const weights = rects.map(rectArea);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let t = rng.frac() * total;
  for (let i = 0; i < rects.length; i++) {
    t -= weights[i];
    if (t <= 0) return rects[i];
  }
  return rects[rects.length - 1];
}
function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function findNonOverlappingPlacement(
  rng: Phaser.Math.RandomDataGenerator,
  rects: WorldRect[],
  existing: Map<number, Placement>,
  minSepPx: number,
  margin: number,
  attempts = 30,
  shrink = 0.85,
): Placement {
  // progressively relax min distance if space is tight
  let minSep = minSepPx;
  const minSep2Initial = minSep * minSep;

  for (let round = 0; round < 5; round++) {
    const minSep2 = minSep * minSep;

    for (let i = 0; i < attempts; i++) {
      const r = pickRectWeighted(rng, rects);
      const { x, y } = pickPointInRect(rng, r, margin);
      let ok = true;
      for (const p of existing.values()) {
        if (dist2({ x, y }, p) < minSep2) { ok = false; break; }
      }
      if (ok) {
        return { x, y, flipX: rng.frac() < MIRROR_CHANCE };
      }
    }
    // relax and try again
    minSep = Math.max(8, Math.floor(minSep * shrink));
  }

  // fallback: last-resort random anywhere
  const r = pickRectWeighted(rng, rects);
  const { x, y } = pickPointInRect(rng, r, margin);
  return { x, y, flipX: rng.frac() < MIRROR_CHANCE };
}

/**
 * Spawns horses with non-overlapping placements.
 * - Reuses `placements` for existing horses (stable positions).
 * - New horses get a position at least `minSepPx` from others.
 * - Deterministic using `seed`.
 */
export function spawnHorsesRandom(
  scene: Phaser.Scene,
  worldLayer: Phaser.GameObjects.Layer,
  uiLayer: Phaser.GameObjects.Layer,
  list: Horse[],
  worldSize: { w: number; h: number },

  resolveHorse: (id: number) => Horse | undefined,
  onHoverIdChange?: (id: number | null) => void,

  placements?: Map<number, Placement>,

  // NEW: options
  opts?: { minSepPx?: number; seed?: string },
) {
  const tooltip = createTooltip(scene, uiLayer);
  const sprites: Phaser.GameObjects.Sprite[] = [];

  const rects = getScaledSafeRects(scene, worldSize.w, worldSize.h, 'bg');
  const placeMap = placements ?? new Map<number, Placement>();

  // Default min separation roughly one sprite height
  const minSepPx = Math.max(12, Math.floor((opts?.minSepPx ?? TARGET_H * 0.95)));
  // Deterministic RNG so refreshes don’t “jump” layout for new horses
  const rng = new Phaser.Math.RandomDataGenerator([opts?.seed ?? 'ph:horses']);

  // Ensure all placements exist for current list (reusing old, creating new)
  for (const h of list) {
    if (!placeMap.has(h.id)) {
      const p = findNonOverlappingPlacement(rng, rects, placeMap, minSepPx, MARGIN, 30, 0.85);
      placeMap.set(h.id, p);
    }
  }

  for (const h of list) {
    const place = placeMap.get(h.id); // exists from block above
    const { x, y, flipX } = place;

    const spr = scene.add.sprite(x, y, sheetKey(h, false), 0)
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true });

    const scale = TARGET_H / FRAME_H;
    spr.setScale(scale);
    spr.setFlipX(flipX);
    spr.setData('horseId', h.id);

    // y-depth painter’s algo (helps readability)
    spr.setDepth(y);

    const shadow = scene.add.sprite(x, y, SHADOW_SHEET_KEY, 0)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setFlipX(flipX)
      .setDepth(y - 1)
      .play(SHADOW_ANIM_KEY);

    // keep ref to destroy shadow with the horse
    spr.setData('shadow', shadow);

    worldLayer.add(shadow);
    worldLayer.add(spr);

    spr.play(animKey(h, false));

    const playBoth = (horseAnimKey: string) => {
      spr.play(horseAnimKey, false);
      shadow.play(SHADOW_ANIM_KEY, false);
    };

    spr.on('pointerover', () => {
      playBoth(animKey(h, true));
      const id = spr.getData('horseId') as number;
      const latest = resolveHorse(id) ?? h;
      showTooltip(tooltip, latest);
      onHoverIdChange?.(id);
    });

    spr.on('pointerout', () => {
      playBoth(animKey(h, false));
      hideTooltip(tooltip);
      onHoverIdChange?.(null);
    });

    spr.on('pointermove', (p: Phaser.Input.Pointer) => moveTooltip(tooltip, p.x, p.y));

    sprites.push(spr);
  }

  return { sprites, tooltip };
}


export type { TooltipRefs };
export { showTooltip };