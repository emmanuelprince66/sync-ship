import { create } from 'zustand'

/** Session-only UI flags (not persisted): the setup prompt shows once per sign-in. */
type UiState = {
  setupPromptOpen: boolean
  setSetupPromptOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(set => ({
  setupPromptOpen: true,
  setSetupPromptOpen: open => set({ setupPromptOpen: open }),
}))
