// src/components/game/Stables/phaser/scenes/LoadingScene.ts
import Phaser from 'phaser';
import type { Horse } from '../../types/horse';

const COLORS = {
    barTrack: 0xdacda8,
    barFill: 0x7d4d45,
    barBorder: 0x582c25,
};

export class LoadingScene extends Phaser.Scene {
    private barBg!: Phaser.GameObjects.Graphics;
    private barFill!: Phaser.GameObjects.Graphics;
    private logoImg!: Phaser.GameObjects.Image;
    private progress = 0;
    private loadStartMs = 0;

    constructor() { super('Loading'); }



    preload() {
        // Show the background UI immediately
        const { width, height } = this.scale;
        this.logoImg = this.add.image(width / 2, height / 2, 'logo').setOrigin(0.5);
        this.fitLogo();

        this.barBg = this.add.graphics().setDepth(10);
        this.barFill = this.add.graphics().setDepth(11);
        this.drawBar(0);

        this.scale.on('resize', () => { this.fitLogo(); this.drawBar(this.progress); });

        // --- queue your actual game assets here ---
        // queue your actual game assets here
        this.load.audio('theme', [
            '/assets/game/phaser/misc/main_theme.ogg',
        ]);
        this.load.audio('click', '/assets/game/phaser/misc/zipclick.flac');
        this.load.image('bg', '/assets/game/phaser/misc/background.png');

        this.load.audio('ph_racing', '/assets/game/phaser/misc/racing.mp3');
        this.load.audio('ph_winner', '/assets/game/phaser/misc/winner.mp3');

        this.load.on('progress', (v: number) => {
            this.progress = v;
            this.drawBar(v);
        });

        this.loadStartMs = this.time.now;

        this.load.once('complete', () => {
            const MIN_MS = 5000;
            const elapsed = this.time.now - this.loadStartMs;
            const wait = Math.max(0, MIN_MS - elapsed);

            const startMain = () => {
                const horseList = (this.registry.get('horseList') as Horse[]) ?? [];
                this.scene.start('Main', { horseList }); // ✅ pass to MainScene.init
            };
            const go = () => this.time.delayedCall(wait, startMain);

            if (this.sound.locked) {
                this.sound.once(Phaser.Sound.Events.UNLOCKED, go);
            } else {
                go();
            }
        });
    }

    private fitLogo() {
        const { width, height } = this.scale;
        const tex = this.textures.get('logo')?.getSourceImage() as HTMLImageElement | undefined;
        if (!tex) return;

        // COVER: scale so image is >= both width and height
        const s = Math.max(width / tex.width, height / tex.height);

        this.logoImg
            .setOrigin(0.5)
            .setPosition(width / 2, height / 2)
            .setDisplaySize(tex.width * s, tex.height * s) // fills the canvas
            .setScrollFactor(0)
            .setDepth(0);
    }

    private drawBar(progress: number) {
        const { width, height } = this.scale;
        const margin = Math.max(8, Math.round(width * 0.02));
        const barW = Math.max(160, Math.round(width - margin * 2));
        const barH = Math.max(10, Math.round(Math.min(20, height * 0.03)));
        const x = margin;
        const y = height - margin - barH;

        this.barBg.clear();
        this.barBg.lineStyle(2, COLORS.barBorder, 1);
        this.barBg.fillStyle(COLORS.barTrack, 1);
        this.barBg.strokeRect(x, y, barW, barH);
        this.barBg.fillRect(x, y, barW, barH);

        const filled = barW * Phaser.Math.Clamp(progress, 0, 1);
        this.barFill.clear();
        this.barFill.fillStyle(COLORS.barFill, 1);
        this.barFill.fillRect(x, y, filled, barH);
    }


}


