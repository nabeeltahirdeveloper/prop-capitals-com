import { create } from "zustand";

export const useChatSupportStore = create((set) => ({
  isOpen: false,
  isMinimized: false,

  openChat: () => set({ isOpen: true, isMinimized: false }),
  closeChat: () => set({ isOpen: false }),
  toggleMinimized: () =>
    set((state) => ({ isMinimized: !state.isMinimized })),
}));

