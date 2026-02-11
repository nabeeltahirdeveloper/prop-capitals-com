import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * @typedef {Record<string, any>} PlatformTokens
 */

export const usePlatformTokensStore = create()(
  persist(
    (set, get) => ({
      /** @type {PlatformTokens} */
      platformTokens: {},

      /**
       * @param {string} id
       * @returns {any}
       */
      getPlatfromToken: (id) => get().platformTokens?.[id],

      /**
       * @param {string} id
       * @param {any} token
       */
      setPlatfromToken: (id, token) =>
        set((state) => ({
          platformTokens: {
            ...(state.platformTokens || {}),
            [id]: token,
          },
        })),

      /**
       * @param {string} id
       */
      clearPlatfromToken: (id) =>
        set((state) => {
          const nextTokens = { ...(state.platformTokens || {}) };
          delete nextTokens[id];
          return { platformTokens: nextTokens };
        }),
    }),
    {
      name: "platform-tokens-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ platformTokens: state.platformTokens }),
    }
  )
);
