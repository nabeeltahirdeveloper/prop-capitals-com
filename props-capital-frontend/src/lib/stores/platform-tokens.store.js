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
      /** @type {string[]} */
      pinnedAccounts: [],

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

      /**
       * @param {string} accountId
       */
      isPinnedAccount: (accountId) =>
        (get().pinnedAccounts || []).includes(accountId),

      /**
       * @param {string} accountId
       */
      togglePinnedAccount: (accountId) =>
        set((state) => {
          const currentPinned = state.pinnedAccounts || [];
          const isPinned = currentPinned.includes(accountId);

          if (isPinned) {
            return {
              pinnedAccounts: currentPinned.filter((id) => id !== accountId),
            };
          }

          if (currentPinned.length >= 4) {
            return state;
          }

          return {
            pinnedAccounts: [...currentPinned, accountId],
          };
        }),
    }),
    {
      name: "platform-tokens-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        platformTokens: state.platformTokens,
        pinnedAccounts: state.pinnedAccounts,
      }),
    }
  )
);
