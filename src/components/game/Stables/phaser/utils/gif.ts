// utils/gif.ts
import { parseGIF, decompressFrames } from 'gifuct-js';

type EnsureOpts = { fps?: number; key?: string };

// Decodes a GIF at runtime and registers an Animation:
// returns the animation key you can sprite.play()
export async function ensureGifAnimation(
  scene: Phaser.Scene,
  url: string,
  opts: EnsureOpts = {}
): Promise<string> {
  const animKey = opts.key ?? url;       // default: url as animation key
  const existing = scene.anims.exists(animKey);
  if (existing) return animKey;

  // fetch ArrayBuffer
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`GIF load failed: ${url}`);
  const buf = await res.arrayBuffer();

  // decode frames
  const gif = parseGIF(buf);
  const frames = decompressFrames(gif, true); // buildRGBA: true

  // turn each frame into a Phaser texture
  const frameKeys: string[] = [];
  const texMgr = scene.textures;

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const c = document.createElement('canvas');
    c.width = f.dims.width;
    c.height = f.dims.height;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(f.dims.width, f.dims.height);
    imgData.data.set(f.patch);
    ctx.putImageData(imgData, 0, 0);

    const frameKey = `${animKey}_f${i}`;
    if (texMgr.exists(frameKey)) texMgr.remove(frameKey);
    texMgr.addCanvas(frameKey, c);
    frameKeys.push(frameKey);
  }

  // build Animation from those texture frames
  const fps = opts.fps ?? 10;
  scene.anims.create({
    key: animKey,
    frames: frameKeys.map(k => ({ key: k })), // one key per frame
    frameRate: fps,
    repeat: -1,
  });

  return animKey;
}
