import { create } from "zustand";
import { persist } from "zustand/middleware";
import { audioManager } from "./audio-manager";
import type { SfxKey } from "./sfx";

interface AudioStore {
  ready: boolean;
  muted: boolean;
  volume: number;

  init: () => Promise<void>;
  play: (key: SfxKey) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      ready: false,
      muted: false,
      volume: 0.6,

      init: async () => {
        if (get().ready) return;
        const { muted, volume } = get();
        audioManager.setVolume(volume);
        if (muted) audioManager.mute();
        await audioManager.preload();
        set({ ready: true });
      },

      play: (key) => {
        if (!get().muted) audioManager.play(key);
      },

      toggleMute: () => {
        const muted = audioManager.toggleMute();
        set({ muted });
      },

      setMuted: (muted) => {
        if (muted) audioManager.mute();
        else audioManager.unmute();
        set({ muted });
      },

      setVolume: (volume) => {
        audioManager.setVolume(volume);
        set({ volume });
      },
    }),
    {
      name: "mooch-audio",
      partialize: (state) => ({
        muted: state.muted,
        volume: state.volume,
      }),
    },
  ),
);
