// src/components/game/Stables/phaser/scenes/MainScene.ts
import Phaser from 'phaser';
import { bus } from '../bus';
import { applyResponsiveViewport } from '../utils/viewport';
import { createLayers } from '../core/layers';
import { createUICamera, resizeUICamera, wireCameraIgnores } from '../core/cameras';
import { initAudio } from '../core/audio';
import { createBackground, fitBackgroundToCover } from '../core/background';
import { enablePan, PanState } from '../core/pan';
import { createHUD } from '../ui/hudRoot';
import { createProfileHUD, type ProfileHUD } from '../ui/profileHUD';
import { BalanceLiveStore, type BalanceStoreOpts } from '../core/balanceService';

import {
    spawnHorsesRandom,
    ensureHorseAnims,
    ensureShadowAnim,
    type TooltipRefs,
    type Placement,
} from '../world/horses';

import type { Horse } from '../../types/horse';
import { HorseLiveStore, type HorseSnapshot } from '../core/horseService';

import { StableLiveStore, type BackendStable } from '../core/stableService';
import { spawnOrUpdateStable } from '../world/stable';

type Layers = {
    world: Phaser.GameObjects.Layer;
    ui: Phaser.GameObjects.Layer;
};

const RACE_MUSIC_KEY = 'ph_racing';
const RACE_MUSIC_URL = '/assets/game/phaser/misc/racing.mp3';
const WIN_MUSIC_KEY = 'ph_winner';
const WIN_MUSIC_URL = '/assets/game/phaser/misc/winner.mp3';

type BgDims = { w: number; h: number };

export class MainScene extends Phaser.Scene {
    // Cameras / UI
    private uiCam!: Phaser.Cameras.Scene2D.Camera;

    // Panning
    private pan!: PanState;
    private disposePan?: () => void;

    // Layers & background dims
    private layers!: Layers;
    private bgDims!: BgDims;

    // HUD and audio (typed loosely to avoid coupling to your specific HUD type)
    private hud: any;
    private audio: any;
    private musicTheme?: Phaser.Sound.BaseSound;   // your main theme (from initAudio)
    private musicOverlay?: Phaser.Sound.BaseSound; // racing / winner

    private getVol(s?: Phaser.Sound.BaseSound, fallback = 1): number {
        if (!s) return fallback;
        const v = (s as any).volume;
        return typeof v === 'number' ? v : fallback;
    }

    private setVol(s?: Phaser.Sound.BaseSound, v?: number) {
        if (!s || !v || typeof v !== 'number') return;
        (s as any).setVolume?.(v);
    }

    private setLoop(s?: Phaser.Sound.BaseSound, loop?: boolean) {
        if (!s || typeof loop !== 'boolean') return;
        (s as any).setLoop?.(loop);
    }

    private fadeVolume(
        s: Phaser.Sound.BaseSound | undefined,
        from: number,
        to: number,
        ms: number
    ) {
        if (!s) return;
        if (ms <= 0) { this.setVol(s, to); return; }
        this.setVol(s, from);
        this.tweens.addCounter({
            from, to, duration: ms, ease: 'Linear',
            onUpdate: (tw) => this.setVol(s, tw.getValue()),
        });
    }

    private async ensureAudio(key: string, url: string): Promise<Phaser.Sound.BaseSound> {
        const existing = this.sound.get(key);
        if (existing) return existing;
        if (!this.cache.audio.has(key)) {
            this.load.audio(key, url);
            await new Promise<void>((resolve) => {
                this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
                this.load.start();
            });
        }
        // add() returns BaseSound (concrete at runtime)
        return this.sound.add(key);
    }

    // ---------- Race music bus handlers ----------
    private readonly onRaceStartMusic = async () => {
        await this.playOverlayLoop(RACE_MUSIC_KEY, RACE_MUSIC_URL, 0.9, 200);
    };

    private readonly onRaceFinishMusic = async () => {
        await this.playOverlayOneShot(WIN_MUSIC_KEY, WIN_MUSIC_URL, 1.0, 120);
    };

    private readonly onRaceResumeMusic = async () => {
        await this.stopOverlayAndUnduck(220); // THEME RESUMES HERE
    };

    // Horses data & sprites
    private horses: Horse[] = [];
    private horseSprites?: { sprites: Phaser.GameObjects.Sprite[]; tooltip: TooltipRefs };
    private readonly horseById = new Map<number, Horse>();
    private hoveredId: number | null = null;
    private profileHUD?: ProfileHUD;
    private balStore?: BalanceLiveStore;
    private balUnsub?: () => void;

    // Live store for in-game fetching
    private store?: HorseLiveStore;
    private unsub?: () => void;

    private readonly placements = new Map<number, Placement>();

    private stableStore?: StableLiveStore;
    private stableUnsub?: () => void;
    private stableDTO: BackendStable | null = null;

    private worldStable!: Phaser.GameObjects.Layer;
    private worldHorses!: Phaser.GameObjects.Layer;

    // Handlers we need to keep references to for cleanup
    private readonly resizeHandler = (size: Phaser.Structs.Size) => {
        applyResponsiveViewport(this);
        // re-fit the background to cover; returns whether pan is enabled
        const panEnabled = fitBackgroundToCover(this, (this as any).__bgSprite);
        this.pan.enabled = panEnabled;

        resizeUICamera(this.uiCam, size.width, size.height);
        if (this.hud?.layout) this.hud.layout(size.width, size.height);
    };

    private readonly playClick = () => {
        // if (this.sound?.mute) return;
        try {
            if (this.sound.locked) return;
            const click = this.audio?.click;
            if (!click || (click).isDestroyed) return;

            const mgr: any = this.sound as any;
            if (mgr.audioContext && mgr.audioContext.state !== 'running') return;

            click.play({ volume: this.sound.volume });
        } catch {
            // never let SFX failures bubble
        }
    };

    constructor() {
        super('Main');
    }

    init(data: { horseList?: Horse[] }) {
        this.horses = data.horseList ?? [];
    }

    private readonly emitProfileBounds = () => {
        const c = this.profileHUD?.container;
        if (!c) return;
        const b = c.getBounds(); // UI camera space == screen pixels
        bus.emit('ui:profile-bounds', { left: b.x, top: b.y, width: b.width, height: b.height });
    };

    create() {

        // --- Viewport & base UI wiring
        applyResponsiveViewport(this);
        bus.emit('hud:show');

        // Layers & cameras
        this.layers = createLayers(this);
        this.uiCam = createUICamera(this);
        wireCameraIgnores(this, this.uiCam, this.layers.world, this.layers.ui);

        this.worldStable = this.add.layer().setName('world-stable').setDepth(100);
        this.worldHorses = this.add.layer().setName('world-horses').setDepth(200);

        this.uiCam.ignore([this.worldStable, this.worldHorses]);

        // Audio + HUD
        this.audio = initAudio(this);
        this.hud = createHUD(this, this.layers.ui, this.audio);
        this.hud.layout(this.scale.width, this.scale.height);

        this.musicTheme =
            (this.audio?.theme as Phaser.Sound.BaseSound | undefined) ??
            (this.sound.get('theme')) ??
            undefined;

        // World background + pan
        const bgSprite = createBackground(this, this.layers.world);
        (this as any).__bgSprite = bgSprite; // stash so resize can refit
        const panEnabled = fitBackgroundToCover(this, bgSprite);
        this.pan = { enabled: panEnabled, active: false, lastX: 0, lastY: 0 };
        this.disposePan = enablePan(this, this.pan, bgSprite);

        // Track background dims for spawners (fitBackgroundToCover sets w/h)
        this.bgDims = { w: (bgSprite as any).w ?? this.scale.width, h: (bgSprite as any).h ?? this.scale.height };

        // Initial ensure & spawn (seeded data from registry/init)
        this.rebuildHorsesSprites().catch(e =>
            console.error('[MainScene] initial horse setup error:', e)
        );

        // --- Input SFX
        this.input.on('pointerup', this.playClick, this);
        this.input.on('gameobjectup', this.playClick, this);
        bus.on('ui:click', this.playClick as any);

        bus.on('race:music:start', this.onRaceStartMusic as any);
        bus.on('race:music:finish', this.onRaceFinishMusic as any);
        bus.on('race:music:resume', this.onRaceResumeMusic as any);

        this.profileHUD = createProfileHUD(this, this.layers.ui, {
            x: 18,
            y: 18,
            scale: 0.64,           // tweak to taste
            avatarOffsetX: 75,     // <-- move the horse.gif left/right under the window
            avatarOffsetY: 75,     // <-- move the horse.gif up/down under the window
            name: '--',       // placeholder
            phorse: 0,
            wron: 0,
            shard: 0,
        });

        this.emitProfileBounds();



        // --- Live store
        const apiBase = this.game.registry.get('apiBase') as string;

        this.balStore = new BalanceLiveStore({
            apiBase,
            credentials: 'include',
            pollBaseMs: 20000,
            jitterRatio: 0.30,
            maxBackoffMs: 120000,
        });

        this.store = new HorseLiveStore({
            apiBase,
            credentials: 'include',
            pollBaseMs: 22000,
            jitterRatio: 0.30,
            maxBackoffMs: 120000,
        });

        this.stableStore = new StableLiveStore(apiBase, 'include');

        this.stableUnsub = this.stableStore.subscribe((snap) => {
            if (snap.stable && snap.stable !== this.stableDTO) {
                this.stableDTO = snap.stable;

                void spawnOrUpdateStable(
                    this,
                    // 3) Put stables on the lower layer
                    this.worldStable,
                    this.layers.ui,
                    { tokenId: snap.stable.tokenId, level: snap.stable.level },
                    { x: 825, y: 425 },
                    1.15
                ).catch((e) => console.error('[MainScene] failed to spawn/update stable:', e));
            }
        });

        this.stableStore.fetchOnce().catch(e => console.error('stable fetch error', e));

        const onSnap = (snap: HorseSnapshot) => {
            // If reference changed, update and respawn
            if (this.horses !== snap.horses) {
                this.horses = snap.horses;
                this.horseById.clear();
                for (const h of this.horses) this.horseById.set(h.id, h);

                this.rebuildHorsesSprites().catch(e =>
                    console.error('[MainScene] rebuild on live update failed:', e)
                );
            }

            // If you want, you can update HUD timers, etc.:
            // this.hud?.updateEnergyTimer?.(snap.nextRecoveryTs);
        };

        const onBal = (snap: import('../core/balanceService').BalanceSnapshot) => {
            if (snap.nickname) this.profileHUD?.setNickname(snap.nickname);
            // r1 = PHORSE, r2 = WRON, r3 = MEDALS (we feed MEDALS into "shard" row text)
            this.profileHUD?.setBalances({
                phorse: snap.phorse ?? 0,
                wron: snap.wron ?? 0,
                shard: snap.medals ?? 0, // text for row 3; when you have a medal icon, just swap the texture key in profileHUD
            });
        };
        this.balUnsub = this.balStore.subscribe(onBal);
        this.balStore.start();

        this.unsub = this.store.subscribe(onSnap);
        this.store.start();

        // Optional: react to gameplay events that change horses (from Phaser or React)
        const onHorseChanged = () => { this.store?.refreshSoon(300); this.balStore?.refreshSoon(300); }
        bus.on('game:horse:changed', onHorseChanged);

        bus.on('canvas:input-enabled', (enabled: boolean) => {
            this.input.enabled = enabled; // disables all Phaser input processing
        });

        // --- Resize & shutdown
        this.scale.on('resize', (size) => {
            this.resizeHandler(size);
            this.emitProfileBounds();
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // input
            this.input.off('pointerup', this.playClick, this);
            this.input.off('gameobjectup', this.playClick, this);
            bus.off('ui:click', this.playClick as any);
            bus.off('canvas:input-enabled');
            bus.off('race:music:start', this.onRaceStartMusic as any);
            bus.off('race:music:finish', this.onRaceFinishMusic as any);
            bus.off('race:music:resume', this.onRaceResumeMusic as any);

            // store
            this.unsub?.();
            this.unsub = undefined;
            this.store?.destroy();
            this.store = undefined;
            this.balUnsub?.(); this.balUnsub = undefined;
            this.balStore?.destroy(); this.balStore = undefined;

            // bus
            bus.off('game:horse:changed', onHorseChanged);

            // hud & pan
            try { this.hud?.destroy?.(); } catch { }
            this.disposePan?.();
            this.profileHUD?.destroy(); this.profileHUD = undefined;

            // sprites cleanup
            try {
                this.horseSprites?.sprites.forEach(s => s.destroy());
                this.horseSprites = undefined;
            } catch { }

            try { this.stableUnsub?.(); } catch { }
            this.stableUnsub = undefined;
            this.stableStore?.destroy();
            this.stableStore = undefined;

            const existing: Phaser.GameObjects.Sprite | undefined = (this as any).__stableSprite;
            if (existing) try { existing.destroy(); } catch { }
            (this as any).__stableSprite = undefined;

            // layers & ui
            bus.emit('hud:hide');
            this.scale.off('resize', this.resizeHandler);
        });
    }

    private async playOverlayLoop(key: string, url: string, targetVol: number, fadeMs: number) {
        // Stop previous overlay if any
        if (this.musicOverlay) {
            try { this.musicOverlay.stop(); this.musicOverlay.destroy(); } catch { }
            this.musicOverlay = undefined;
        }

        // Duck theme
        if (this.musicTheme) this.fadeVolume(this.musicTheme, this.getVol(this.musicTheme, 0.85), 0.01, fadeMs);

        // Start overlay loop
        const s = await this.ensureAudio(key, url);
        try { s.stop(); } catch { }
        this.setLoop(s, true);
        this.setVol(s, 0);
        s.play();
        this.fadeVolume(s, 0, targetVol, fadeMs);
        this.musicOverlay = s;
    }

    private async playOverlayOneShot(key: string, url: string, targetVol: number, fadeMs: number) {
        // Replace any previous overlay (e.g. stop racing loop)
        if (this.musicOverlay) {
            try { this.musicOverlay.stop(); this.musicOverlay.destroy(); } catch { }
            this.musicOverlay = undefined;
        }

        // Keep theme ducked while winner plays
        if (this.musicTheme) this.fadeVolume(this.musicTheme, this.getVol(this.musicTheme, 0.85), 0.01, fadeMs);

        const s = await this.ensureAudio(key, url);
        try { s.stop(); } catch { }
        this.setLoop(s, false);
        this.setVol(s, 0);
        s.play();
        this.fadeVolume(s, 0, targetVol, fadeMs);
        this.musicOverlay = s;
    }

    private async stopOverlayAndUnduck(fadeMs: number) {
        if (this.musicOverlay) {
            const s = this.musicOverlay;
            this.musicOverlay = undefined;
            try {
                this.fadeVolume(s, this.getVol(s, 1), 0, Math.min(150, fadeMs));
                this.time.delayedCall(Math.min(160, fadeMs + 20), () => { try { s.stop(); s.destroy(); } catch { } });
            } catch { }
        }

        // Resume main theme (start if needed)
        if (this.musicTheme && !this.musicTheme.isPlaying) {
            try {
                this.musicTheme.stop();
                this.setLoop(this.musicTheme, true);
                this.setVol(this.musicTheme, 0);
                this.musicTheme.play();
            } catch { }
        }
        if (this.musicTheme) {
            this.fadeVolume(this.musicTheme, this.getVol(this.musicTheme, 0), 0.85, fadeMs);
        }
    }

    /** Ensure textures/anims and (re)spawn horses with current list */
    private async rebuildHorsesSprites() {
        // Clear if empty
        if (!this.horses || this.horses.length === 0) {
            if (this.horseSprites) {
                this.horseSprites.sprites.forEach(s => {
                    const sh = s.getData('shadow') as Phaser.GameObjects.Sprite | undefined;
                    try { sh?.destroy(); } catch { }
                    try { s.destroy(); } catch { }
                });
                this.horseSprites.tooltip.root.setVisible(false);
                this.horseSprites = undefined;
            }
            // also clear placements—no horses present
            this.placements.clear();
            return;
        }

        await ensureShadowAnim(this);
        await ensureHorseAnims(this, this.horses);

        // Destroy old (horse + shadow)
        if (this.horseSprites) {
            this.horseSprites.sprites.forEach(s => {
                const sh = s.getData('shadow') as Phaser.GameObjects.Sprite | undefined;
                try { sh?.destroy(); } catch { }
                try { s.destroy(); } catch { }
            });
            this.horseSprites.tooltip.root.setVisible(false);
            this.horseSprites = undefined;
        }

        const liveIds = new Set(this.horses.map(h => h.id));
        for (const id of Array.from(this.placements.keys())) {
            if (!liveIds.has(id)) this.placements.delete(id);
        }

        // Spawn new
        this.horseSprites = spawnHorsesRandom(
            this,
            // Horses on the higher layer so they render above & receive clicks first
            this.worldHorses,
            this.layers.ui,
            this.horses,
            { w: this.bgDims.w, h: this.bgDims.h },
            (id) => this.horseById.get(id),
            (idOrNull) => { this.hoveredId = idOrNull; },
            this.placements,
        );
    }
}
