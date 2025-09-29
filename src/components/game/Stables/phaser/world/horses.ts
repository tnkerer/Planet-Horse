import Phaser from 'phaser';
import type { Horse } from '../../types/horse';
import { bus } from '../bus';
import {
  ensureStatusOverlayAssets,
  applyStatusOverlay,
} from './statusOverlays';


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

const NEIGH_KEYS = ['neigh-01', 'neigh-02', 'neigh-03'] as const;
const NEIGH_URLS = [
  '/assets/game/phaser/misc/neigh-01.wav',
  '/assets/game/phaser/misc/neigh-02.wav',
  '/assets/game/phaser/misc/neigh-03.wav',
];


// Tooltip (label/value) -------------------------------------------------------
type TooltipRow = { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text };
type TooltipRefs = { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle; rows: TooltipRow[] };


// === Safe zones in *source image* coordinates (unscaled) ===
type SrcRect = { x1: number; y1: number; x2: number; y2: number };
const SAFE_RECTS_SRC: SrcRect[] = [
  { x1: 1425, y1: 80, x2: 1960, y2: 770 }, // (1552,744) (1552,20) (1984,20) (1984,744)
  { x1: 1675, y1: 770, x2: 1960, y2: 1104 },
  { x1: 1125, y1: 770, x2: 1495, y2: 1104 }, // (924,760) (924,560) (1552,560) (1552,760)
  { x1: 970, y1: 20, x2: 1190, y2: 450 },

  // HUD Region
  { x1: 200, y1: 200, x2: 500, y2: 500 },
  // LEFT CORNER
  { x1: 20, y1: 500, x2: 300, y2: 800 },
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

function clampMenuToScreen(
  scene: Phaser.Scene,
  x: number, y: number,
  w: number, h: number,
  pad = 8
) {
  const sw = scene.scale.width;
  const sh = scene.scale.height;
  const nx = Math.min(Math.max(pad, x), sw - w - pad);
  const ny = Math.min(Math.max(pad, y), sh - h - pad);
  return { x: nx, y: ny };
}

type HorseMenu = {
  root: Phaser.GameObjects.Container;
  showAt: (screenX: number, screenY: number, horseId: number) => void;
  hide: () => void;
  destroy: () => void;
  setResolver: (r: (id: number) => Horse | undefined) => void; // NEW
};

function createHorseContextMenu(
  scene: Phaser.Scene,
  uiLayer: Phaser.GameObjects.Layer,
  getHorseById?: (id: number) => Horse | undefined
): HorseMenu {
  ensureNeighSfx(scene); // keep your neigh SFX loader if you added it

  const root = scene.add.container(0, 0).setDepth(10_000).setVisible(false);
  uiLayer.add(root);

  // Panel
  const paddingX = 10;
  const itemH = 28;
  const width = 140;

  let currentHorseId: number | null = null;
  let resolver: ((id: number) => Horse | undefined) | undefined = getHorseById;

  const bg = scene.add.rectangle(0, 0, width, itemH + 8, 0xbe9c7f, 1).setOrigin(0, 0);
  bg.setStrokeStyle(1, 0x7d4d45, 1);
  root.add(bg);

  type MenuItem = {
    key: string;
    hit: Phaser.GameObjects.Rectangle;
    txt: Phaser.GameObjects.Text;
    setEnabled: (enabled: boolean) => void;
  };

  const items: Record<string, MenuItem> = {};

  let neighLock = false;

  function playNeighIfIdle(scene: Phaser.Scene) {
    const mgr = scene.sound;
    if (!mgr || neighLock) return;

    // If any of our neigh sounds is already playing, do nothing
    for (const k of NEIGH_KEYS) {
      const s = mgr.get(k);
      if (s && (s.isPlaying || s.isPaused)) {
        return;
      }
    }

    const choices = NEIGH_KEYS.filter(k => scene.cache.audio.exists(k));
    if (choices.length === 0) return;

    const key = Phaser.Utils.Array.GetRandom(choices);

    // Reuse or create an instance so we can subscribe to end events
    let snd = mgr.get(key);
    if (!snd) snd = mgr.add(key);

    neighLock = true;
    const release = () => {
      neighLock = false;
      snd?.off('complete', release);
      snd?.off('stop', release);
    };
    snd.once('complete', release);
    snd.once('stop', release);
    snd.play({ volume: 0.6 });
  }


  const mkItem = (label: string, onClick: () => void): MenuItem => {
    const idx = Object.keys(items).length;
    const y = 4 + idx * itemH;

    const hit = scene.add.rectangle(0, y, width, itemH, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    const txt = scene.add.text(paddingX, y + 6, label, {
      fontFamily: 'SpaceHorse, sans-serif',
      fontSize: '14px',
      color: '#333333',
    });

    let enabled = true;
    const setEnabled = (e: boolean) => {
      enabled = e;
      if (enabled) {
        hit.setInteractive({ useHandCursor: true });
        txt.setAlpha(1);
        txt.setColor('#333333');
      } else {
        hit.disableInteractive();
        txt.setAlpha(0.55);
        txt.setColor('#666666');
        hit.setFillStyle(0x000000, 0); // ensure no hover bg remains
      }
    };

    hit.on('pointerover', () => {
      if (!enabled) return;
      hit.setFillStyle(0x7d4d45, 1);
      txt.setColor('#ffffff');
    });
    hit.on('pointerout', () => {
      if (!enabled) return;
      hit.setFillStyle(0x000000, 0);
      txt.setColor('#333333');
    });
    hit.on('pointerup', () => {
      if (!enabled) return;
      onClick();
    });

    root.add(hit);
    root.add(txt);
    bg.setSize(width, 8 + (idx + 1) * itemH);

    const mi = { key: label.toLowerCase(), hit, txt, setEnabled };
    items[mi.key] = mi;
    return mi;
  };

  // OPEN
  mkItem('Open', () => {
    if (currentHorseId != null) {
      playNeighIfIdle(scene);
      bus.emit('ui:click');
      bus.emit('ui:open-horse', currentHorseId);
      bus.emit('horse:open', { id: currentHorseId });
    }
    root.setVisible(false);
  });

  // RACE (enabled only when status === 'IDLE')
  const raceItem = mkItem('Race', () => {
    if (currentHorseId != null) {
      bus.emit('ui:click');
      bus.emit('horse:race', { id: currentHorseId });
    }
    root.setVisible(false);
  });

  // RESTORE (enabled only when status === 'BRUISED')
  const restoreItem = mkItem('Restore', () => {
    if (currentHorseId != null) {
      bus.emit('ui:click');
      bus.emit('horse:restore', { id: currentHorseId });
    }
    root.setVisible(false);
  });

  // BURN
  mkItem('Burn', () => {
    if (currentHorseId != null) {
      bus.emit('ui:click');
      bus.emit('horse:burn', { id: currentHorseId });
    }
    root.setVisible(false);
  });

  // hide on outside click
  const onGlobalDown = (_p: Phaser.Input.Pointer, targets: any[]) => {
    if (!root.visible) return;
    const hitOurMenu = targets.some(t => (t).parentContainer === root || t === bg);
    if (!hitOurMenu) root.setVisible(false);
  };
  scene.input.on('pointerdown', onGlobalDown);

  return {
    root,
    setResolver: (r) => { resolver = r; },
    showAt: (screenX, screenY, horseId) => {
      currentHorseId = horseId;

      // look up current status to enable/disable items
      const h = resolver?.(horseId);
      const status = h?.staty?.status ?? '';

      raceItem.setEnabled(status === 'IDLE');
      restoreItem.setEnabled(status === 'BRUISED');

      // optional: play random neigh on open (if already cached)
      const available = NEIGH_KEYS.filter(k => scene.cache.audio.exists(k));
      if (available.length > 0) {
        scene.sound.play(Phaser.Utils.Array.GetRandom(available), { volume: 0.6 });
      }

      const { w, h: hh } = { w: bg.width, h: bg.height };
      const pos = clampMenuToScreen(scene, screenX, screenY, w, hh, 8);
      root.setPosition(pos.x, pos.y);
      root.setVisible(true);
    },
    hide: () => root.setVisible(false),
    destroy: () => {
      try { scene.input.off('pointerdown', onGlobalDown); } catch { }
      try { root.destroy(true); } catch { }
    },
  };
}

function createTooltip(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer): TooltipRefs {
  const root = scene.add.container(0, 0).setDepth(2000).setVisible(false);
  const bg = scene.add.rectangle(0, 0, 10, 10, 0x95AEDB, 0.9).setStrokeStyle(1, 0x3e3631).setOrigin(0, 0);
  const mkText = (color = '#000') => scene.add.text(0, 0, '', { fontFamily: 'SpaceHorse, sans-serif', fontSize: '14px', color });
  const rows: TooltipRow[] = Array.from({ length: 10 }).map(() => ({ label: mkText('#583400'), value: mkText('#000000') }));
  root.add([bg, ...rows.flatMap(r => [r.label, r.value])]); uiLayer.add(root);
  return { root, bg, rows };
}
function showTooltip(t: TooltipRefs, h: Horse) {
  const rarityColorMap: Record<string, string> = { common: '#00aa00', uncommon: '#2F35A8', rare: '#800080', epic: '#ff69b4', legendary: '#a78e06', mythic: '#E21C21' };
  const sexColorMap: Record<string, string> = { male: '#2F35A8', female: '#dc207e' };
  const name = (h.profile.nickname?.trim()?.length ? h.profile.nickname : h.profile.name).slice(0, 16);

  const rows: Array<[string, string, string?]> = [
    ['ID:', h.id],
    ['NAME:', name],
    ['SEX:', h.profile.sex, sexColorMap[h.profile.sex.toLowerCase()] ?? '#000000'],
    ['RARITY:', h.profile.type_horse, rarityColorMap[h.profile.type_horse_slug] ?? '#000000'],
    // ['GEN:', h.staty.generation],
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

function ensureNeighSfx(scene: Phaser.Scene) {
  const toLoad: Array<{ key: string; url: string }> = [];
  for (let i = 0; i < NEIGH_KEYS.length; i++) {
    const k = NEIGH_KEYS[i];
    if (!scene.cache.audio.exists(k)) {
      toLoad.push({ key: k, url: NEIGH_URLS[i] });
    }
  }
  if (toLoad.length > 0) {
    toLoad.forEach(({ key, url }) => scene.load.audio(key, url));
    scene.load.start(); // fire-and-forget; menu can show while these finish
  }
}

// Paths/keys -------------------------------------------------------------------
const sheetUrl = (h: Horse, hovered: boolean) =>
  `/assets/game/breeding/stable-horses/right/${h.profile.type_horse_slug}/${h.profile.name_slug}-${hovered ? 'hover' : 'regular'}-spritesheet.png`;
const sheetKey = (h: Horse, hovered: boolean) => `horse-${h.id}-${hovered ? 'hover' : 'regular'}-sheet`;
const animKey = (h: Horse, hovered: boolean) => `horse-${h.id}-${hovered ? 'hover' : 'regular'}-run`;

export async function ensureShadowAnim(scene: Phaser.Scene) {
  let queued = 0;

  // Shadow
  if (!scene.textures.exists(SHADOW_SHEET_KEY)) {
    scene.load.spritesheet(SHADOW_SHEET_KEY, SHADOW_SHEET_URL, { frameWidth: 48, frameHeight: 48 });
    queued++;
  }

  if (queued > 0) {
    await new Promise<void>(resolve => {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      scene.load.start();
    });
  }

  // Shadow anim (unchanged)
  if (!scene.anims.exists(SHADOW_ANIM_KEY)) {
    scene.anims.create({
      key: SHADOW_ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(SHADOW_SHEET_KEY, {}),
      frameRate: FPS_RUN,
      repeat: -1,
    });
  }

  // NEW: ensure status overlay sheets & animations (sleep/hurt/breeding)
  await ensureStatusOverlayAssets(scene);
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
  opts?: { minSepPx?: number; seed?: string },
) {
  const tooltip = createTooltip(scene, uiLayer);
  const sprites: Phaser.GameObjects.Sprite[] = [];

  // NEW: ensure a single shared context menu
  const menuKey = '__horse_ctx_menu__';
  let menu: HorseMenu = (scene as any)[menuKey];
  if (!menu) {
    menu = createHorseContextMenu(scene, uiLayer, resolveHorse);
    (scene as any)[menuKey] = menu;

    // Clean up on shutdown
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      menu.destroy();
      (scene as any)[menuKey] = undefined;
    });
  } else {
    // keep resolver fresh if this spawner is re-run
    menu.setResolver(resolveHorse);
  }

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

    applyStatusOverlay(scene, worldLayer, spr, h.staty.status, y, TARGET_H);

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

    spr.on('pointerup', (p: Phaser.Input.Pointer) => {
      const id = spr.getData('horseId') as number;
      // Show the dropdown near the click
      menu.showAt(p.x, p.y, id);
      bus.emit('ui:click');
    });

    sprites.push(spr);
  }

  return { sprites, tooltip };
}


export type { TooltipRefs };
export { showTooltip };