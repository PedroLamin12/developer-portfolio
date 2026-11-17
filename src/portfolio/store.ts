import { create } from "zustand";
import type { SectionId, Constellation } from "./content";

export type Focus = "overview" | SectionId;

type CampState = {
  focus: Focus;
  entered: boolean;
  ready: boolean;
  muted: boolean;
  lanternLit: boolean;
  hovered: SectionId | null;
  highlight: Constellation["id"] | null;
  showStats: boolean;
  snap: boolean;
  setSnap: (s: boolean) => void;
  setFocus: (f: Focus) => void;
  enter: () => void;
  setReady: (r: boolean) => void;
  setMuted: (m: boolean) => void;
  setHovered: (h: SectionId | null) => void;
  setHighlight: (h: Constellation["id"] | null) => void;
  toggleStats: () => void;
};

export const useCamp = create<CampState>((set) => ({
  focus: "overview",
  entered: false,
  ready: false,
  muted: false,
  lanternLit: false,
  hovered: null,
  highlight: null,
  showStats: false,
  snap: false,
  setSnap: (snap) => set({ snap }),
  setFocus: (focus) =>
    set((s) => ({ focus, entered: true, lanternLit: s.lanternLit || focus === "tent" })),
  enter: () => set({ entered: true }),
  setReady: (ready) => set({ ready }),
  setMuted: (muted) => set({ muted }),
  setHovered: (hovered) => set({ hovered }),
  setHighlight: (highlight) => set({ highlight }),
  toggleStats: () => set((s) => ({ showStats: !s.showStats })),
}));

// Live render stats written by the scene each half second; read by the HUD on an interval.
export const perfStats = { fps: 0, calls: 0, triangles: 0 };
