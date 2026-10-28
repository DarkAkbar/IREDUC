import { create } from "zustand";

type PublishSheetState = {
  visible: boolean;
  /** Après connexion, rouvrir la feuille. */
  reopenAfterAuth: boolean;
  fabCollapsed: boolean;
  fabHidden: boolean;
  open: () => void;
  close: () => void;
  setReopenAfterAuth: (value: boolean) => void;
  setFabCollapsed: (value: boolean) => void;
  setFabHidden: (value: boolean) => void;
};

export const usePublishSheetStore = create<PublishSheetState>((set) => ({
  visible: false,
  reopenAfterAuth: false,
  fabCollapsed: false,
  fabHidden: false,
  open: () => set({ visible: true, fabCollapsed: false }),
  close: () => set({ visible: false }),
  setReopenAfterAuth: (reopenAfterAuth) => set({ reopenAfterAuth }),
  setFabCollapsed: (fabCollapsed) => set({ fabCollapsed }),
  setFabHidden: (fabHidden) => set({ fabHidden }),
}));
