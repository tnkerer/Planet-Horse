// scenes/MainScene.ts
import Phaser from 'phaser';
import { bus } from '../bus';
import { applyResponsiveViewport } from '../utils/viewport';
import { createLayers } from '../core/layers';
import { createUICamera, resizeUICamera, wireCameraIgnores } from '../core/cameras';
import { initAudio } from '../core/audio';
import { createBackground, fitBackgroundToCover } from '../core/background';
import { enablePan, PanState } from '../core/pan';
import { createHUD } from '../ui/hudRoot';
import { spawnHorsesRandom, ensureHorseAnims, ensureShadowAnim, type TooltipRefs, showTooltip } from '../world/horses'; // adjust path

import type { Horse } from '../../types/horse';

export class MainScene extends Phaser.Scene {
    private uiCam!: Phaser.Cameras.Scene2D.Camera;
    private pan!: PanState;
    private disposePan?: () => void;
    private horses: Horse[] = [];
    private horseSprites?: ReturnType<typeof spawnHorsesRandom>;
    private readonly horseById = new Map<number, Horse>();
    private hoveredId: number | null = null;
    private readonly tooltip?: TooltipRefs;

    constructor() { super('Main'); }

    init(data: { horseList?: Horse[] }) {
        this.horses = data.horseList ?? [];
        console.log('[MainScene] horseList received:', this.horses);
    }

    private readonly handleHorsesUpdate = (list: Horse[]) => {
        this.horses = list;
        // update any UI/state in scene that depends on horses
    };

    create() {
        applyResponsiveViewport(this);
        bus.emit('hud:show');
        bus.on('horses:update', this.handleHorsesUpdate);
        this.time.delayedCall(0, () => bus.emit('horses:request'));

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            bus.off('horses:update', this.handleHorsesUpdate);
        });
        // layers & cameras
        const layers = createLayers(this);
        const mainCam = this.cameras.main;
        this.uiCam = createUICamera(this);
        wireCameraIgnores(this, this.uiCam, layers.world, layers.ui);

        // audio + HUD
        const audio = initAudio(this);
        const hud = createHUD(this, layers.ui, audio);

        // world bg + pan
        const bg = createBackground(this, layers.world);
        const panEnabled = fitBackgroundToCover(this, bg);
        this.pan = { enabled: panEnabled, active: false, lastX: 0, lastY: 0 };
        this.disposePan = enablePan(this, this.pan, bg);

        // initial layout
        hud.layout(this.scale.width, this.scale.height);

        (async () => {
            try {
                await ensureShadowAnim(this);               // ⬅️ add this
                await ensureHorseAnims(this, this.horses);
                this.horseSprites = spawnHorsesRandom(
                    this, layers.world, layers.ui, this.horses, { w: bg.w, h: bg.h }, (id) => this.horseById.get(id),             // resolver
                    (idOrNull) => { this.hoveredId = idOrNull; } // track current hover
                );
            } catch (e) {
                console.error('[MainScene] horse anims error:', e);
            }
        })();

        // click sfx (light debounce optional)
        const click = audio.click;

        // keep your arrow func, add guards + try/catch so it never throws
        const playClick = () => {
            // if muted, do nothing
            if (this.sound?.mute) return;

            try {
                // audio not unlocked yet? don't play
                if (this.sound.locked) return;

                // missing or destroyed click buffer? bail
                if (!click || (click as any).isDestroyed) return;

                // some browsers suspend WebAudio; skip if not running
                const mgr: any = this.sound as any;
                if (mgr.audioContext && mgr.audioContext.state !== 'running') return;

                // finally safe to play
                click.play({ volume: this.sound.volume });
            } catch {
                // NEVER let sfx errors bubble into React button handlers
            }
        };

        this.input.on('pointerup', playClick, this);
        this.input.on('gameobjectup', playClick, this);
        bus.on('ui:click', playClick as any);

        // resize
        this.scale.on('resize', (size) => {
            applyResponsiveViewport(this);
            this.pan.enabled = fitBackgroundToCover(this, bg);
            resizeUICamera(this.uiCam, size.width, size.height);
            hud.layout(size.width, size.height);
        });

        // shutdown
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.off('pointerup', playClick, this);
            this.input.off('gameobjectup', playClick, this);
            bus.off('ui:click', playClick as any);
            hud.destroy();
            this.disposePan?.();
            bus.emit('hud:hide');
            bus.off('horses:update', this.handleHorsesUpdate);
        });


    }

}
