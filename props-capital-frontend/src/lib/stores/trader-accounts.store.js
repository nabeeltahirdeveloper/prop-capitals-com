import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * @typedef {Record<string, string>} SelectedChallengeIdsByUser
 */

export const useTraderAccountsStore = create()(
  persist(
    (set, get) => ({
      /** @type {SelectedChallengeIdsByUser} */
      selectedChallengeIds: {},

      /**
       * @param {string} userId
       * @returns {string | undefined}
       */
      getSelectedChallengeId: (userId) =>
        get().selectedChallengeIds?.[userId],

      /**
       * @param {string} userId
       * @param {string} challengeId
       */
      setSelectedChallengeId: (userId, challengeId) =>
        set((state) => ({
          selectedChallengeIds: {
            ...(state.selectedChallengeIds || {}),
            [userId]: challengeId,
          },
        })),

      /**
       * @param {string} userId
       */
      clearSelectedChallengeId: (userId) =>
        set((state) => {
          const nextIds = { ...(state.selectedChallengeIds || {}) };
          delete nextIds[userId];
          return { selectedChallengeIds: nextIds };
        }),
    }),
    {
      name: "trader-accounts-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedChallengeIds: state.selectedChallengeIds,
      }),
    }
  )
);
