import { Howl, Howler } from "howler";
import { SFX_EVENTS, type SfxKey } from "./sfx";

class AudioManager {
  private static instance: AudioManager | null = null;

  private sounds = new Map<SfxKey, Howl>();
  private volume = 1;
  private muted = false;
  private loaded = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  preload(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (typeof window === "undefined") return Promise.resolve();

    const promises = (Object.entries(SFX_EVENTS) as [SfxKey, string][]).map(
      ([key, src]) =>
        new Promise<void>((resolve) => {
          const howl = new Howl({
            src: [src],
            preload: true,
            onload: () => resolve(),
            onloaderror: (_id: number, err: unknown) => {
              console.warn(`[AudioManager] Failed to load "${key}":`, err);
              resolve();
            },
          });
          this.sounds.set(key, howl);
        }),
    );

    return Promise.all(promises).then(() => {
      this.loaded = true;
    });
  }

  play(key: SfxKey, volume?: number): void {
    if (typeof window === "undefined") return;
    const howl = this.sounds.get(key);
    if (!howl) return;
    const id = howl.play();
    howl.volume((volume ?? 1) * this.volume, id);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    Howler.volume(this.volume);
  }

  getVolume(): number {
    return this.volume;
  }

  mute(): void {
    this.muted = true;
    Howler.mute(true);
  }

  unmute(): void {
    this.muted = false;
    Howler.mute(false);
  }

  toggleMute(): boolean {
    if (this.muted) this.unmute();
    else this.mute();
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  isReady(): boolean {
    return this.loaded;
  }

  dispose(): void {
    for (const howl of this.sounds.values()) {
      howl.unload();
    }
    this.sounds.clear();
    this.loaded = false;
  }
}

export const audioManager = AudioManager.getInstance();
