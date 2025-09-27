import Phaser from 'phaser';
import { STABLE_LEVELS, STABLE_META } from '../constants/stables';

export type StableDTO = {
    tokenId: string;   // "1".."400"
    level: number;     // 1..4
};

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

/* ------------------------------- Tooltip ------------------------------- */

type TTText = { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text };
type StableTooltip = { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle; rows: TTText[] };

function createStableTooltip(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer): StableTooltip {
    // reuse look’n’feel from horses tooltip
    const root = scene.add.container(0, 0).setDepth(2000).setVisible(false);
    const bg = scene.add.rectangle(0, 0, 10, 10, 0x95AEDB, 0.9).setStrokeStyle(1, 0x3e3631).setOrigin(0, 0);
    const mk = (color = '#000') =>
        scene.add.text(0, 0, '', { fontFamily: 'SpaceHorse, sans-serif', fontSize: '14px', color });
    const rows: TTText[] = Array.from({ length: 8 }).map(() => ({ label: mk('#583400'), value: mk('#000000') }));
    root.add([bg, ...rows.flatMap(r => [r.label, r.value])]);
    uiLayer.add(root);
    return { root, bg, rows };
}
function hideStableTooltip(t: StableTooltip) { t.root.setVisible(false); }

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
    if (x < pad) x = pad;
    if (x + w > sw - pad) x = sw - pad - w;
    if (y < pad) y = pad;
    if (y + h > sh - pad) y = sh - pad - h;
    t.root.setPosition(x, y);
}

function showStableTooltip(t: StableTooltip, dto: StableDTO) {
    const level = Math.max(1, Math.min(4, Math.floor(dto.level))) as 1 | 2 | 3 | 4;
    const info = STABLE_LEVELS[level];

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
        const w = (row.value.x + row.value.width) - padX;
        maxW = Math.max(maxW, w);
        y += Math.max(row.label.height, row.value.height) + gap;
    });

    t.bg.setSize(maxW + padX * 2, y + padY);
    t.root.setVisible(true);
}



/**
 * Create (or replace) the stable sprite at the exact world position.
 * - Center is exactly at (x, y)
 * - Depth uses y for painter’s algo, like horses.
 */
export async function spawnOrUpdateStable(
    scene: Phaser.Scene,
    worldLayer: Phaser.GameObjects.Layer,
    uiLayer: Phaser.GameObjects.Layer,
    dto: StableDTO,
    pos = { x: 1310, y: 750 },
    scale?: number, // optional external scaling if you need it later
) {
    const level = Math.max(1, Math.min(4, Math.floor(dto.level))) as 1 | 2 | 3 | 4;
    const key = TEX_KEYS[level];
    await ensureStableTexture(scene, level);

    // Ensure a single tooltip instance
    let tip: StableTooltip | undefined = (scene as any).__stableTooltip;
    if (!tip) {
        tip = createStableTooltip(scene, uiLayer);
        (scene as any).__stableTooltip = tip;

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            try { tip?.root.destroy(true); } catch { }
            (scene as any).__stableTooltip = undefined;
        });
    }

    // If there’s already a stable sprite, swap texture if level changed
    const prev: Phaser.GameObjects.Sprite | undefined = (scene as any).__stableSprite;
    if (prev) {
        const prevKey = prev.texture.key;
        if (prevKey !== key) {
            prev.setTexture(key);
        }
        prev.setPosition(pos.x, pos.y)
            .setOrigin(0.5, 0.5)     // center sits exactly on pos
            .setDepth(pos.y);
        if (scale != null) prev.setScale(scale);
        prev.setData('stableDto', dto);
        return prev;
    }

    const spr = scene.add.sprite(pos.x, pos.y, key)
        .setOrigin(0.5, 0.5)
        .setDepth(pos.y)
        .setInteractive({ useHandCursor: false });

    if (scale != null) spr.setScale(scale);

    // stash dto for tooltip
    spr.setData('stableDto', dto);

    // Hover tooltip
    spr.on('pointerover', () => {
        const d = (spr.getData('stableDto') as StableDTO) ?? dto;
        showStableTooltip((scene as any).__stableTooltip, d);
    });
    spr.on('pointerout', () => {
        hideStableTooltip((scene as any).__stableTooltip);
    });
    spr.on('pointermove', (p: Phaser.Input.Pointer) => {
        moveStableTooltip((scene as any).__stableTooltip, p.x, p.y);
    });

    worldLayer.add(spr);
    (scene as any).__stableSprite = spr;

    // Clean up on scene shutdown
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        try { spr.destroy(); } catch { }
        (scene as any).__stableSprite = undefined;
    });

    return spr;
}
