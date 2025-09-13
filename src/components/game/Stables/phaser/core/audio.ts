// core/audio.ts
import Phaser from 'phaser';
import { LS_KEYS, getSavedBool, getSavedNum, save } from '../utils/storage';

export type AudioState = {
  music: Phaser.Sound.BaseSound;
  click: Phaser.Sound.BaseSound | null;   // <- allow null
  musicOn: boolean;
  volume: number;
};

export function initAudio(scene: Phaser.Scene): AudioState {
  const musicOn = getSavedBool(LS_KEYS.musicOn, true);
  const volume  = getSavedNum(LS_KEYS.volume, 0.6);

  const music = scene.sound.add('theme', { loop: true });

  // create click only if it exists in cache
  const click = scene.cache.audio.exists('click') ? scene.sound.add('click') : null; // <- guard

  scene.sound.mute = !musicOn;
  scene.sound.volume = volume;

  if (musicOn) {
    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (!music.isPlaying) music.play({ loop: true, volume });
      });
    } else {
      music.play({ loop: true, volume });
    }
  }

  return { music, click, musicOn, volume };
}

export function toggleMusic(scene: Phaser.Scene, audio: AudioState, setIcon: (txt: string) => void) {
  audio.musicOn = !audio.musicOn;
  save(LS_KEYS.musicOn, audio.musicOn ? '1' : '0');

  if (audio.musicOn) {
    scene.sound.mute = false;
    if (audio.music.isPaused) audio.music.resume();
    else if (!audio.music.isPlaying) audio.music.play({ loop: true, volume: audio.volume });
  } else {
    scene.sound.mute = true;
  }
  setIcon(audio.musicOn ? '🔊' : '🔇');
}

export function setVolume(scene: Phaser.Scene, audio: AudioState, v: number, onAfter?: () => void) {
  audio.volume = Phaser.Math.Clamp(v, 0, 1);
  save(LS_KEYS.volume, String(audio.volume));
  scene.sound.volume = audio.volume;
  onAfter?.();
}
