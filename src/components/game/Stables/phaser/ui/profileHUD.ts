import Phaser from 'phaser';

export type ProfileHUDOptions = {
    x?: number;               // top-left position in the UI layer
    y?: number;
    scale?: number;           // overall scale of the card
    depth?: number;           // base depth for the container
    // Easy-to-tune avatar offsets (relative to the card's top-left, pre-scale)
    avatarOffsetX?: number;
    avatarOffsetY?: number;
    // Text placeholders
    name?: string;
    nickname?: string;
    phorse?: string | number;
    wron?: string | number;
    shard?: string | number;
    targetWidth?: number;
};

export type ProfileHUD = {
    container: Phaser.GameObjects.Container;
    setNickname: (name: string) => void;
    setName: (name: string) => void;
    setBalances: (vals: { phorse?: string | number; wron?: string | number; shard?: string | number }) => void;
    setAvatarOffsets: (ox: number, oy: number) => void;
    setScale: (s: number) => void;
    destroy: () => void;
};

function scaleToPixels(img: Phaser.GameObjects.Image, targetPx: number) {
    const src = img.texture.getSourceImage() as HTMLImageElement;
    const s = targetPx / src.width;
    img.setScale(s);
}

const fmt = (v: string | number) =>
    typeof v === 'number'
        ? (v >= 1000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(v) : v.toLocaleString())
        : v;

export function createProfileHUD(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Layer | Phaser.GameObjects.Container,
    opts: ProfileHUDOptions = {}
): ProfileHUD {
    const ifaceSrc = scene.textures.get('hud-interface').getSourceImage() as HTMLImageElement;

    // ---- Defaults
    const x = opts.x ?? 16;
    const y = opts.y ?? 16;
    const baseScale = opts.scale ?? (opts.targetWidth ? (opts.targetWidth / ifaceSrc.width) : 0.5);
    const baseDepth = opts.depth ?? 1000;

    // These offsets position the avatar under the cutout on interface.png (before scaling).
    // Tweak these two numbers to nudge the avatar under the window.
    let avatarOX = opts.avatarOffsetX ?? 78;
    let avatarOY = opts.avatarOffsetY ?? 82;

    // ---- Root container (attach to your UI layer)
    const container = scene.add.container(x, y).setDepth(baseDepth);
    parent.add(container);

    // ---- Avatar (MUST be under the interface so the rim "masks" it)
    const avatar = scene.add.image(0, 0, 'hud-avatar').setOrigin(0.5, 0.5);
    scaleToPixels(avatar, 174); // ~120px wide looks good; change if needed
    container.add(avatar);

    // ---- Interface overlay (above avatar)
    const iface = scene.add.image(0, 0, 'hud-interface').setOrigin(0, 0);
    container.add(iface);

    // Depth ordering inside the container
    avatar.setDepth(0);
    iface.setDepth(1);

    // Scale the whole card together so all children keep relative layout crisp
    container.setScale(baseScale);

    // Position avatar under the circular window; we keep plain numbers here (pre-scale),
    // so you only tweak avatarOX / avatarOY without thinking about scale.
    const placeAvatar = () => {
        avatar.setPosition(avatarOX, avatarOY);
    };
    placeAvatar();

    // ---- Text + Icon rows (three rows)
    // Layout constants (pre-scale coordinates)
    const NAME_X = 170;
    const NAME_Y = 15;
    const ROW_X = 172;
    const ROW1_Y = 64;
    const ROW_GAP = 28;
    const ICON_PX = 22; // icon target width in pixels

    const nameText = scene.add.text(NAME_X, NAME_Y, (opts.nickname ?? 'USER').toUpperCase(), {
        fontFamily: 'SpaceHorse, sans-serif', fontSize: '24px', color: '#ffffff',
        stroke: '#4a2018', strokeThickness: 3,
    });
    container.add(nameText);

    const row = (texKey: string, label: string | number, y1: number) => {
        const icon = scene.add.image(ROW_X, y1, texKey).setOrigin(0, 0.5);
        scaleToPixels(icon, ICON_PX);
        const text = scene.add.text(ROW_X + ICON_PX + 8, y1 - 1, fmt(label), {
            fontFamily: 'SpaceHorse, sans-serif', fontSize: '20px', color: '#fff1d8',
            stroke: '#4a2018', strokeThickness: 3,
        }).setOrigin(0, 0.5);
        container.add(icon); container.add(text);
        return { icon, text };
    };

    const r1 = row('icon-phorse', opts.phorse ?? 0, ROW1_Y);
    const r2 = row('icon-wron', opts.wron ?? 0, ROW1_Y + ROW_GAP);
    const r3 = row('icon-medal', opts.shard ?? 0, ROW1_Y + ROW_GAP * 2); // currently shard icon; swap to medal if you add one


    // Optional: tiny decorative line texts could be added if you want, but interface.png already has etch lines

    function setNickname(v: string) { nameText.setText((v ?? '').toUpperCase()); }
    const setName = setNickname; // alias
    function setBalances(vals: { phorse?: string | number; wron?: string | number; shard?: string | number }) {
        if (vals.phorse != null) r1.text.setText(fmt(vals.phorse));
        if (vals.wron != null) r2.text.setText(fmt(vals.wron));
        if (vals.shard != null) r3.text.setText(fmt(vals.shard));
    }
    function setAvatarOffsets(ox: number, oy: number) { avatarOX = ox; avatarOY = oy; placeAvatar(); }
    function setScale(s: number) { container.setScale(s); }
    function destroy() { try { container.destroy(true); } catch { } }

    return { container, setNickname, setName, setBalances, setAvatarOffsets, setScale, destroy };
}
