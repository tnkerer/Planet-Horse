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

import {
    spawnHorsesRandom,
    ensureHorseAnims,
    ensureShadowAnim,
    type TooltipRefs,
    type Placement,
} from '../world/horses';

import type { Horse } from '../../types/horse';
import { HorseLiveStore, type HorseSnapshot } from '../core/horseService';

type Layers = {
    world: Phaser.GameObjects.Layer;
    ui: Phaser.GameObjects.Layer;
};

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

    // Horses data & sprites
    private horses: Horse[] = [];
    private horseSprites?: { sprites: Phaser.GameObjects.Sprite[]; tooltip: TooltipRefs };
    private readonly horseById = new Map<number, Horse>();
    private hoveredId: number | null = null;

    // Live store for in-game fetching
    private store?: HorseLiveStore;
    private unsub?: () => void;

    private readonly placements = new Map<number, Placement>();


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
        if (this.sound?.mute) return;
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

    create() {
        // --- Viewport & base UI wiring
        applyResponsiveViewport(this);
        bus.emit('hud:show');

        // Layers & cameras
        this.layers = createLayers(this);
        this.uiCam = createUICamera(this);
        wireCameraIgnores(this, this.uiCam, this.layers.world, this.layers.ui);

        // Audio + HUD
        this.audio = initAudio(this);
        this.hud = createHUD(this, this.layers.ui, this.audio);
        this.hud.layout(this.scale.width, this.scale.height);

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

        // --- Live store
        const apiBase = this.game.registry.get('apiBase') as string;
        this.store = new HorseLiveStore({
            apiBase,
            credentials: 'include',
            pollBaseMs: 22000,
            jitterRatio: 0.30,
            maxBackoffMs: 120000,
        });

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

        this.unsub = this.store.subscribe(onSnap);
        this.store.start();

        // Optional: react to gameplay events that change horses (from Phaser or React)
        const onHorseChanged = () => this.store?.refreshSoon(300);
        bus.on('game:horse:changed', onHorseChanged);

        // --- Resize & shutdown
        this.scale.on('resize', this.resizeHandler);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // input
            this.input.off('pointerup', this.playClick, this);
            this.input.off('gameobjectup', this.playClick, this);
            bus.off('ui:click', this.playClick as any);

            // store
            this.unsub?.();
            this.unsub = undefined;
            this.store?.destroy();
            this.store = undefined;

            // bus
            bus.off('game:horse:changed', onHorseChanged);

            // hud & pan
            try { this.hud?.destroy?.(); } catch { }
            this.disposePan?.();

            // sprites cleanup
            try {
                this.horseSprites?.sprites.forEach(s => s.destroy());
                this.horseSprites = undefined;
            } catch { }

            // layers & ui
            bus.emit('hud:hide');
            this.scale.off('resize', this.resizeHandler);
        });
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
            this.layers.world,
            this.layers.ui,
            this.horses,
            { w: this.bgDims.w, h: this.bgDims.h },
            (id) => this.horseById.get(id),
            (idOrNull) => { this.hoveredId = idOrNull; },
            this.placements, // ✅ pass stable placements map
        );
    }
}
