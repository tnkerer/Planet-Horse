// src/components/game/Stables/phaser/core/createGame.ts
import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { LoadingScene } from '../scenes/LoadingScene';
import { MainScene } from '../scenes/MainScene';

export function createGame(host: HTMLElement,  opts: { horseList?: any; apiBase: string }) {
  const cfg: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: host,
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: 10,
      height: 10,
      zoom: 1 / Math.min(window.devicePixelRatio || 1, 2),
    },
    physics: { default: 'arcade' },
    audio: {
      disableWebAudio: false,
      noAudio: false,
    },
    scene: [BootScene, LoadingScene, MainScene],
  };

  const game = new Phaser.Game(cfg);

    // registry values for scenes
  game.registry.set('apiBase', opts.apiBase);

  // ✅ stash horseList so LoadingScene can pass it to Main
  game.registry.set('horseList', opts.horseList ?? []);

  const applyZoom = () => game.scale.setZoom(1 / Math.min(window.devicePixelRatio || 1, 2));

  const ro = new ResizeObserver(([entry]) => {
    const r = entry?.contentRect; if (!r) return;
    game.scale.resize(r.width, r.height);
    applyZoom();
  });
  ro.observe(host); // ✅ was `parent` (undefined)

  const onVis = () => (document.hidden ? game.loop.sleep() : game.loop.wake());
  const onWinResize = () => applyZoom();
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', onWinResize);

  return () => {
    try { ro.disconnect(); } catch {}
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', onWinResize);
    try { game.destroy(true); } catch {}
  };
}
