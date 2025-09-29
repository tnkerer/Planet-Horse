// eslint-disable-next-line
// @ts-ignore - Next bundler will resolve this to a final URL
import Phaser from 'phaser';
import { STABLE_LEVELS, STABLE_META } from '../constants/stables';
import { bus } from '../bus';

export type StableDTO = {
  tokenId: string;   // "1".."400"
  level: number;     // 1..4
};

/* ===========================================================
   Textures
=========================================================== */
const TEX_KEYS: Record<1 | 2 | 3 | 4, string> = {
  1: 'stable-l1',
  2: 'stable-l2',
  3: 'stable-l3',
  4: 'stable-l4',
};
const TEX_URLS: Record<1 | 2 | 3 | 4, string> = {
  1: '/assets/game/phaser/misc/stable1.png',
  2: '/assets/game/phaser/misc/stable2.png',
  3: '/assets/game/phaser/misc/stable3.png',
  4: '/assets/game/phaser/misc/stable4.png',
};

const CLOSE_ICON_KEY = 'ui-close-x';
const CLOSE_ICON_URL = '/assets/game/pop-up/fechar.png';

export async function ensureStableTexture(scene: Phaser.Scene, level: number) {
  const lv = (Math.max(1, Math.min(4, Math.floor(level))) as 1 | 2 | 3 | 4);
  const key = TEX_KEYS[lv];
  if (scene.textures.exists(key)) return;

  scene.load.image(key, TEX_URLS[lv]);
  await new Promise<void>(resolve => {
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.start();
  });
}

async function ensureCloseIcon(scene: Phaser.Scene) {
  if (!scene.textures.exists(CLOSE_ICON_KEY)) {
    scene.load.image(CLOSE_ICON_KEY, CLOSE_ICON_URL);
    await new Promise<void>(resolve => {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      scene.load.start();
    });
  }
}

/* ===========================================================
   Backend types & helpers
=========================================================== */
type StableStatus = {
  tokenId: string;
  level: number;                 // current level (1..4)
  upgrading: boolean;
  upgradeStarted: string | null; // ISO
  upgradeEndsAt: string | null;  // ISO
  upgradeRemainingSeconds: number | null;
  horsesHoused: number;
  capacity: number;
  simultaneousBreeds: number;
  extraEnergyPerTick: number;
};

// Read API base set by MainScene (createGame registry)
function apiBase(scene: Phaser.Scene) {
  return (scene.game.registry.get('apiBase') as string) ?? '';
}

async function fetchStatus(scene: Phaser.Scene, tokenId: string): Promise<StableStatus> {
  const res = await fetch(`${apiBase(scene)}/stable/${tokenId}/status`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return res.json();
}

async function callStartUpgrade(scene: Phaser.Scene, tokenId: string) {
  const res = await fetch(`${apiBase(scene)}/stable/${tokenId}/upgrade`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `Upgrade ${res.status}`);
  return body;
}

async function callFinishUpgrade(scene: Phaser.Scene, tokenId: string) {
  const res = await fetch(`${apiBase(scene)}/stable/${tokenId}/upgrade/finish`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `Finish ${res.status}`);
  return body;
}

/* ===========================================================
   Tooltip (unchanged)
=========================================================== */
type TTText = { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text };
type StableTooltip = { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle; rows: TTText[] };

function createStableTooltip(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer): StableTooltip {
  const root = scene.add.container(0, 0).setDepth(2000).setVisible(false);
  const bg = scene.add.rectangle(0, 0, 10, 10, 0x95AEDB, 0.9).setStrokeStyle(1, 0x3e3631).setOrigin(0, 0);
  const mk = (color = '#000') => scene.add.text(0, 0, '', { fontFamily: 'SpaceHorse, sans-serif', fontSize: '14px', color });
  const rows: TTText[] = Array.from({ length: 8 }).map(() => ({ label: mk('#583400'), value: mk('#000000') }));
  root.add([bg, ...rows.flatMap(r => [r.label, r.value])]);
  uiLayer.add(root);
  return { root, bg, rows };
}
const hideStableTooltip = (t: StableTooltip) => t.root.setVisible(false);

function moveStableTooltip(t: StableTooltip, screenX: number, screenY: number) {
  const scene = t.root.scene;
  const sw = scene.scale.width;
  const sh = scene.scale.height;
  const pad = 12;
  const ox = 14;
  const oy = 10;
  const w = t.bg.width;
  const h = t.bg.height;
  let x = screenX + ox;
  let y = screenY - oy - h;
  if (x + w > sw - pad) x = screenX - ox - w;
  if (y < pad) y = screenY + oy;
  if (x < pad) x = pad; if (x + w > sw - pad) x = sw - pad - w;
  if (y < pad) y = pad; if (y + h > sh - pad) y = sh - pad - h;
  t.root.setPosition(x, y);
}
function showStableTooltip(t: StableTooltip, dto: StableDTO) {
  const lv = (Math.max(1, Math.min(4, Math.floor(dto.level))) as 1 | 2 | 3 | 4);
  const info = STABLE_LEVELS[lv];
  const rows: Array<[string, string]> = [
    ['STABLE:', `#${dto.tokenId}`],
    ['LEVEL:', String(info.level)],
    ['CAPACITY:', String(info.capacity)],
    ['SIM. BREEDS:', String(info.simultaneousBreeds)],
    ['ENERGY TICK:', `+${info.extraEnergyPerTick} / ${STABLE_META.extraTickEveryHours}h`],
    ['UPGRADE COST:', `${info.upgradeCostPhorse.toLocaleString()} PHORSE`],
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
    const [label, value] = spec;
    row.label.setText(label);
    row.value.setText(' ' + value);
    row.label.setPosition(padX, y);
    row.value.setPosition(padX + row.label.width + 6, y);
    maxW = Math.max(maxW, (row.value.x + row.value.width) - padX);
    y += Math.max(row.label.height, row.value.height) + gap;
  });
  t.bg.setSize(maxW + padX * 2, y + padY);
  t.root.setVisible(true);
}

/* ===========================================================
   Label above the Stable (styled like breeding HUD tag)
=========================================================== */
type StableLabel = {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  line1: Phaser.GameObjects.Text; // "Stable #ID"
  line2: Phaser.GameObjects.Text; // "Lvl X • Open" or "Lvl X • Upgrading 01:23:45"
  setText: (s1: string, s2: string) => void;
  setPos: (x: number, y: number) => void;
  show: () => void;
  hide: () => void;
};
const LABEL_CFG = {
  padX: 8,
  padY: 4,
  gap: 2,
  // ⬇ tweak vertical offset (in world px) so it sits above the roof
  offsetY: -110,
  depth: 9999
};

function makeLabel(scene: Phaser.Scene, worldLayer: Phaser.GameObjects.Layer): StableLabel {
  const root = scene.add.container(0, 0).setDepth(LABEL_CFG.depth).setVisible(false);
  const bg = scene.add.rectangle(0, 0, 20, 10, 0x000000, 0.45).setOrigin(0, 0).setStrokeStyle(0, 0);
  const mkText = (size: number, weight700 = false) =>
    scene.add.text(0, 0, '', {
      fontFamily: 'SpaceHorse, sans-serif',
      fontSize: `${size}px`,
      color: '#ffffff',
      strokeThickness: 0,
      fontStyle: weight700 ? 'bold' as any : undefined,
    }).setShadow(0, 1, '#000000', 2, true, true);

  // mimic the stud label sizes
  const line1 = mkText(12, false); // ID badge
  const line2 = mkText(13, true);  // name row (here we show Level + Status)

  root.add([bg, line1, line2]);
  worldLayer.add(root);

  const setText = (s1: string, s2: string) => {
    const { padX, padY, gap } = LABEL_CFG;
    line1.setText(s1);
    line2.setText(s2);

    line1.setPosition(padX, padY);
    line2.setPosition(padX, padY + line1.height + gap);

    const w = Math.max(line1.width, line2.width) + padX * 2;
    const h = line1.height + gap + line2.height + padY * 2;
    bg.setSize(w, h);
  };

  const setPos = (x: number, y: number) => {
    root.setPosition(x - bg.width / 2, y + LABEL_CFG.offsetY);
  };

  return {
    root, bg, line1, line2,
    setText, setPos,
    show: () => root.setVisible(true),
    hide: () => root.setVisible(false),
  };
}

/* ===========================================================
   Simple Dropdown Menu (Upgrade / Finish)
=========================================================== */
type StableMenu = {
  root: Phaser.GameObjects.Container;
  showAt: (screenX: number, screenY: number, status: StableStatus) => void;
  hide: () => void;
  refresh: (status: StableStatus) => void;
  destroy: () => void;
};

function clampMenu(scene: Phaser.Scene, x: number, y: number, w: number, h: number, pad = 8) {
  const sw = scene.scale.width;
  const sh = scene.scale.height;
  const nx = Math.min(Math.max(pad, x), sw - w - pad);
  const ny = Math.min(Math.max(pad, y), sh - h - pad);
  return { x: nx, y: ny };
}

function createStableMenu(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer): StableMenu {
  const root = scene.add.container(0, 0).setDepth(10_200).setVisible(false);
  uiLayer.add(root);

  const baseWidth = 180;
  const itemH = 28;
  const padX = 10;

  const bg = scene.add.rectangle(0, 0, baseWidth, 8 + 2 * itemH, 0xbe9c7f, 1).setOrigin(0, 0);
  bg.setStrokeStyle(1, 0x7d4d45, 1);
  root.add(bg);

  // ROW 0: Horses…
  const horsesHit = scene.add
    .rectangle(0, 4, baseWidth, itemH, 0x000000, 0)
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });
  const horsesTxt = scene.add.text(padX, 4 + 6, 'Horses', {
    fontFamily: 'SpaceHorse, sans-serif',
    fontSize: '14px',
    color: '#333333',
  });
  root.add(horsesHit);
  root.add(horsesTxt);

  horsesHit.on('pointerover', () => {
    horsesHit.setFillStyle(0x7d4d45, 1);
    horsesTxt.setColor('#ffffff');
  });
  horsesHit.on('pointerout', () => {
    horsesHit.setFillStyle(0x000000, 0);
    horsesTxt.setColor('#333333');
  });

  // ROW 1: Upgrade / Finish / Max…
  const upHit = scene.add
    .rectangle(0, 4 + itemH, baseWidth, itemH, 0x000000, 0)
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });
  const upTxt = scene.add.text(padX, 4 + itemH + 6, 'Upgrade', {
    fontFamily: 'SpaceHorse, sans-serif',
    fontSize: '14px',
    color: '#333333',
  });
  root.add(upHit);
  root.add(upTxt);

  let current: StableStatus | null = null;
  let upEnabled = true;

  const setUpEnabled = (e: boolean) => {
    upEnabled = e;
    if (upEnabled) {
      upHit.setInteractive({ useHandCursor: true });
      upTxt.setAlpha(1).setColor('#333333');
    } else {
      upHit.disableInteractive();
      upTxt.setAlpha(0.55).setColor('#666666');
      upHit.setFillStyle(0x000000, 0);
    }
  };

  // Horses click → open React modal via bus, then close menu
  horsesHit.on('pointerup', () => {
    if (!current) return;
    bus.emit('stable:horses-open', { tokenId: current.tokenId });
    root.setVisible(false);
  });

  // Upgrade/Finish click (same behavior you had)
  upHit.on('pointerover', () => {
    if (upEnabled) {
      upHit.setFillStyle(0x7d4d45, 1);
      upTxt.setColor('#ffffff');
    }
  });
  upHit.on('pointerout', () => {
    if (upEnabled) {
      upHit.setFillStyle(0x000000, 0);
      upTxt.setColor('#333333');
    }
  });
  upHit.on('pointerup', async () => {
    if (!upEnabled || !current) return;
    const tokenId = current.tokenId;
    try {
      if (current.upgrading && (current.upgradeRemainingSeconds ?? 1) <= 0) {
        await callFinishUpgrade(scene, tokenId);
        const fresh = await fetchStatus(scene, tokenId);
        refreshLabelAndMenu(scene, fresh);
        // swap sprite if level incremented
        const spr: Phaser.GameObjects.Sprite | undefined = (scene as any).__stableSprite;
        if (spr && fresh.level !== (spr.getData('stableDto') as StableDTO)?.level) {
          const lv = Math.max(1, Math.min(4, Math.floor(fresh.level))) as 1 | 2 | 3 | 4;
          await ensureStableTexture(scene, lv);
          spr.setTexture(TEX_KEYS[lv]);
          const dto = spr.getData('stableDto') as StableDTO;
          spr.setData('stableDto', { ...dto, level: fresh.level });
        }
        const p: Popup = (scene as any).__stablePopup;
        p?.show('Upgrade finalized!', 'success');
      } else {
        await callStartUpgrade(scene, tokenId);
        const fresh = await fetchStatus(scene, tokenId);
        refreshLabelAndMenu(scene, fresh);
        const p: Popup = (scene as any).__stablePopup;
        p?.show('Upgrade started!', 'success');
      }
    } catch (e: any) {
      const p: Popup = (scene as any).__stablePopup;
      p?.show(e?.message ?? 'Action failed', 'error', 3500);
    } finally {
      root.setVisible(false);
    }
  });

  function applyStatus(s: StableStatus) {
    current = s;

    const maxed = s.level >= 4;
    const eta = s.upgradeRemainingSeconds ?? null;
    const canFinish = s.upgrading && (eta ?? 1) <= 0;

    if (canFinish) {
      upTxt.setText('Finish Upgrade');
      setUpEnabled(true);
    } else if (maxed) {
      upTxt.setText('Max Level');
      setUpEnabled(false);
    } else if (s.upgrading) {
      upTxt.setText(`Upgrading… ${fmtHMS(Math.max(0, eta ?? 0))}`);
      setUpEnabled(false);
    } else {
      upTxt.setText('Upgrade');
      setUpEnabled(true);
    }

    // Resize to the widest line, height = exactly 2 rows (no vertical gap)
    const w = Math.max(baseWidth, horsesTxt.width + padX * 2, upTxt.width + padX * 2);
    bg.setSize(w, 8 + 2 * itemH);
    horsesHit.setSize(w, itemH);
    upHit.setSize(w, itemH);
  }

  const onGlobalDown = (_p: Phaser.Input.Pointer, targets: any[]) => {
    if (!root.visible) return;
    const inside = targets.some(t => (t).parentContainer === root || t === bg);
    if (!inside) root.setVisible(false);
  };
  scene.input.on('pointerdown', onGlobalDown);

  return {
    root,
    refresh: applyStatus,
    showAt: (x, y, s) => {
      applyStatus(s);
      const { w, h } = { w: bg.width, h: bg.height };
      const pos = clampMenu(scene, x, y, w, h, 8);
      root.setPosition(pos.x, pos.y);
      root.setVisible(true);
    },
    hide: () => root.setVisible(false),
    destroy: () => {
      try { scene.input.off('pointerdown', onGlobalDown); } catch {}
      try { root.destroy(true); } catch {}
    },
  };
}


/* ===========================================================
   Utilities
=========================================================== */
function fmtHMS(total: number) {
  const s = Math.max(0, Math.floor(total));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

type Popup = {
  show: (msg: string, kind: 'success' | 'error', ttlMs?: number) => void;
  hide: () => void;
  root: Phaser.GameObjects.Container;
};

function createPopup(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer): Popup {
  const root = scene.add.container(0, 0).setDepth(10_500).setVisible(false);
  uiLayer.add(root);

  const PAD = 12;
  const bg = scene.add.rectangle(0, 0, 300, 80, 0x000000, 0.75)
    .setOrigin(0, 0)
    .setStrokeStyle(1, 0xffffff, 0.4);
  const txt = scene.add.text(PAD, PAD, '', {
    fontFamily: 'SpaceHorse, sans-serif',
    fontSize: '16px',
    color: '#ffffff',
    wordWrap: { width: 300 - PAD * 2 },
  });
  const close = scene.add.image(0, 0, CLOSE_ICON_KEY).setOrigin(1, 0).setDisplaySize(24, 24).setInteractive({ useHandCursor: true });
  root.add([bg, txt, close]);

  let timer: number | null = null;

  const layout = () => {
    // center-top-ish
    const sw = scene.scale.width;
    const w = Math.max(260, txt.width + PAD * 2);
    const h = Math.max(48, txt.height + PAD * 2);
    bg.setSize(w, h);
    close.setPosition(w - 4, 4);
    root.setPosition(Math.round((sw - w) / 2), 20);
  };

  close.on('pointerup', () => {
    if (timer != null) { window.clearTimeout(timer); timer = null; }
    root.setVisible(false);
  });

  return {
    root,
    hide: () => {
      if (timer != null) { window.clearTimeout(timer); timer = null; }
      root.setVisible(false);
    },
    show: (msg, kind, ttlMs = 2500) => {
      txt.setText(msg);
      txt.setColor(kind === 'success' ? '#c8ffb0' : '#ffb0b0');
      layout();
      root.setVisible(true);
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(() => { root.setVisible(false); timer = null; }, ttlMs);
    },
  };
}

/* ===========================================================
   Countdown runtime (updates label every 1s when upgrading)
=========================================================== */
type LabelCountdown = {
  timer?: Phaser.Time.TimerEvent;
  endsAtMs?: number | null;
};

/** ensure a single countdown holder on scene */
function ensureCountdown(scene: Phaser.Scene): LabelCountdown {
  let rt: LabelCountdown | undefined = (scene as any).__stableCountdown;
  if (!rt) {
    rt = {};
    (scene as any).__stableCountdown = rt;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (rt?.timer) { try { rt.timer.remove(false); } catch {} }
      (scene as any).__stableCountdown = undefined;
    });
  }
  return rt;
}

function stopCountdown(scene: Phaser.Scene) {
  const rt: LabelCountdown | undefined = (scene as any).__stableCountdown;
  if (rt?.timer) { try { rt.timer.remove(false); } catch {} rt.timer = undefined; }
  if (rt) rt.endsAtMs = null;
}

function startCountdown(scene: Phaser.Scene, st: StableStatus) {
  const label: StableLabel | undefined = (scene as any).__stableLabel;
  const spr: Phaser.GameObjects.Sprite | undefined = (scene as any).__stableSprite;
  const menu: StableMenu | undefined = (scene as any).__stableMenu;
  if (!label || !spr) return;

  const rt = ensureCountdown(scene);
  // compute endsAt
  const endsAtMs = st.upgradeEndsAt ? Date.parse(st.upgradeEndsAt) : (
    st.upgradeRemainingSeconds != null ? Date.now() + st.upgradeRemainingSeconds * 1000 : null
  );
  rt.endsAtMs = endsAtMs ?? null;

  // clear any previous
  if (rt.timer) { try { rt.timer.remove(false); } catch {} rt.timer = undefined; }

  if (!endsAtMs) return; // nothing to tick

  rt.timer = scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      const remain = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      const s1 = `Stable #${st.tokenId}`;
      const s2 = remain > 0
        ? `Lvl ${st.level} • Upgrading ${fmtHMS(remain)}`
        : `Lvl ${st.level} • Upgrading 00:00:00`;

      label.setText(s1, s2);
      label.setPos(spr.x, spr.y);
      label.show();

      // When it hits 0, keep showing 00:00:00 and flip the menu to "Finish Upgrade"
      if (remain <= 0) {
        if (menu) {
          menu.refresh({ ...st, upgradeRemainingSeconds: 0, upgrading: true });
        }
        // stop the ticking; UI now expects user to click "Finish Upgrade"
        stopCountdown(scene);
      }
    },
  });
}

/* ===========================================================
   Spawner / Updater
=========================================================== */
export async function spawnOrUpdateStable(
  scene: Phaser.Scene,
  worldLayer: Phaser.GameObjects.Layer,
  uiLayer: Phaser.GameObjects.Layer,
  dto: StableDTO,
  pos = { x: 1310, y: 750 },
  scale?: number
) {
  const level = Math.max(1, Math.min(4, Math.floor(dto.level))) as 1 | 2 | 3 | 4;
  const key = TEX_KEYS[level];
  await ensureStableTexture(scene, level);
  await ensureCloseIcon(scene); // ⬅️ for popup

  // ensure popup singleton
  let popup: Popup | undefined = (scene as any).__stablePopup;
  if (!popup) {
    popup = createPopup(scene, uiLayer);
    (scene as any).__stablePopup = popup;
  }

  // ensure tooltip (as you already have)
  let tip: StableTooltip | undefined = (scene as any).__stableTooltip;
  if (!tip) {
    tip = createStableTooltip(scene, uiLayer);
    (scene as any).__stableTooltip = tip;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { tip?.root.destroy(true); } catch { }
      (scene as any).__stableTooltip = undefined;
    });
  }

  // ensure label
  let label: StableLabel | undefined = (scene as any).__stableLabel;
  if (!label) {
    label = makeLabel(scene, worldLayer);
    (scene as any).__stableLabel = label;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { label?.root.destroy(true); } catch { }
      (scene as any).__stableLabel = undefined;
    });
  }

  // ensure dropdown menu (single item → no gap)
  let menu: StableMenu | undefined = (scene as any).__stableMenu;
  if (!menu) {
    menu = createStableMenu(scene, uiLayer);
    (scene as any).__stableMenu = menu;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { menu?.destroy(); } catch { }
      (scene as any).__stableMenu = undefined;
    });
  }

  const prev: Phaser.GameObjects.Sprite | undefined = (scene as any).__stableSprite;
  if (prev) {
    if (prev.texture.key !== key) prev.setTexture(key);
    prev.setPosition(pos.x, pos.y).setOrigin(0.5, 0.5).setDepth(10);
    if (scale != null) prev.setScale(scale);
    prev.setData('stableDto', dto);

    // position label and show current status immediately
    const d = (prev.getData('stableDto') as StableDTO) ?? dto;
    (async () => {
      try {
        const st = await fetchStatus(scene, d.tokenId);
        refreshLabelAndMenu(scene, st);
      } catch { /* noop */ }
    })();

    return prev;
  }

  const spr = scene.add.sprite(pos.x, pos.y, key)
    .setOrigin(0.5, 0.5)
    .setDepth(10)
    .setInteractive({ useHandCursor: true });

  if (scale != null) spr.setScale(scale);
  spr.setData('stableDto', dto);

  // Tooltip hover (kept)
  spr.on('pointerover', () => {
    const d = (spr.getData('stableDto') as StableDTO) ?? dto;
    showStableTooltip((scene as any).__stableTooltip, d);
  });
  spr.on('pointerout', () => { hideStableTooltip((scene as any).__stableTooltip); });
  spr.on('pointermove', (p: Phaser.Input.Pointer) => { moveStableTooltip((scene as any).__stableTooltip, p.x, p.y); });

  // Initial label: fetch status now and display + start countdown if upgrading
  (async () => {
    try {
      const st = await fetchStatus(scene, dto.tokenId);
      refreshLabelAndMenu(scene, st);
    } catch { /* silent */ }
  })();

  // Click → fetch status, refresh label, open menu
  spr.on('pointerup', async (p: Phaser.Input.Pointer) => {
    const d = (spr.getData('stableDto') as StableDTO) ?? dto;
    hideStableTooltip((scene as any).__stableTooltip);
    try {
      const st = await fetchStatus(scene, d.tokenId);
      refreshLabelAndMenu(scene, st);
      (scene as any).__stableMenu.showAt(p.x, p.y, st);
    } catch (e: any) {
      const pop: Popup = (scene as any).__stablePopup;
      pop?.show(e?.message ?? 'Failed to load status', 'error', 3500);
    }
  });

  worldLayer.add(spr);
  (scene as any).__stableSprite = spr;

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    try { spr.destroy(); } catch { }
    (scene as any).__stableSprite = undefined;
    stopCountdown(scene);
  });

  return spr;
}

/* ===========================================================
   Label/Menu refresher
=========================================================== */
function refreshLabelAndMenu(scene: Phaser.Scene, st: StableStatus) {
  const label: StableLabel | undefined = (scene as any).__stableLabel;
  const spr: Phaser.GameObjects.Sprite | undefined = (scene as any).__stableSprite;
  const menu: StableMenu | undefined = (scene as any).__stableMenu;
  if (!label || !spr) return;

  const s1 = `Stable #${st.tokenId}`;
  const s2 = st.upgrading
    ? `Lvl ${st.level} • Upgrading ${fmtHMS(Math.max(0, st.upgradeRemainingSeconds ?? 0))}`
    : `Lvl ${st.level} • Open`;

  label.setText(s1, s2);
  label.setPos(spr.x, spr.y);
  label.show();

  if (menu) menu.refresh(st);

  // start/stop countdown based on status
  if (st.upgrading) {
    startCountdown(scene, st);
  } else {
    stopCountdown(scene);
  }
}
