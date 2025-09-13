// ui/hudRoot.ts
import Phaser from 'phaser';
import { createSoundToggle, layoutToggle } from './soundToggle';
import { createVolumeSlider, layoutSlider, pointerToValue, setSliderValue, SliderRefs } from './volumeSlider';
import { AudioState, toggleMusic, setVolume } from '../core/audio';

export type HUD = {
  toggle: ReturnType<typeof createSoundToggle>;
  slider: SliderRefs;
  layout: (canvasW: number, canvasH: number) => void;
  destroy: () => void;
};

export function createHUD(scene: Phaser.Scene, uiLayer: Phaser.GameObjects.Layer, audio: AudioState): HUD {
  const toggle = createSoundToggle(scene, uiLayer, () => toggleMusic(scene, audio, (txt) => toggle.icon.setText(txt)));
  toggle.icon.setText(audio.musicOn ? '🔊' : '🔇');

  const slider = createVolumeSlider(scene, uiLayer, audio.volume);

  // interactions
  let dragging = false;
  const begin = (p: Phaser.Input.Pointer) => { dragging = true; setFromPointer(p); };
  const move  = (p: Phaser.Input.Pointer) => { if (dragging) setFromPointer(p); };
  const end   = () => { dragging = false; };

  function setFromPointer(p: Phaser.Input.Pointer) {
    const v = pointerToValue(slider, p);
    setVolume(scene, audio, v, () => setSliderValue(slider, v));
  }

  slider.hit.on('pointerdown', begin);
  scene.input.on('pointermove', move);
  scene.input.on('pointerup', end);
  scene.input.on('pointerupoutside', end);

  // layout function
  const layout = (canvasW: number, canvasH: number) => {
    const pad = Math.max(8, Math.round(canvasW * 0.012));
    const x = canvasW - pad;
    const y = pad;
    layoutToggle(toggle, x, y);
    layoutSlider(scene, slider, x, y + 18, canvasW);
  };

  const destroy = () => {
    scene.input.off('pointermove', move);
    scene.input.off('pointerup', end);
    scene.input.off('pointerupoutside', end);
    toggle.bg.destroy(); toggle.icon.destroy();
    slider.root.destroy();
  };

  return { toggle, slider, layout, destroy };
}
