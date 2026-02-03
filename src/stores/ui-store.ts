import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isFilterOpen: boolean;
  activeModal: string | null;
}

interface UIActions {
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;

  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  openFilter: () => void;
  closeFilter: () => void;
  toggleFilter: () => void;

  openModal: (modalId: string) => void;
  closeModal: () => void;

  closeAll: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // State
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isFilterOpen: false,
  activeModal: null,

  // Mobile Menu Actions
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // Search Actions
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  // Filter Actions
  openFilter: () => set({ isFilterOpen: true }),
  closeFilter: () => set({ isFilterOpen: false }),
  toggleFilter: () => set((state) => ({ isFilterOpen: !state.isFilterOpen })),

  // Modal Actions
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // Close all
  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isSearchOpen: false,
      isFilterOpen: false,
      activeModal: null,
    }),
}));

// Selector hooks
export const useIsMobileMenuOpen = () => useUIStore((state) => state.isMobileMenuOpen);
export const useIsSearchOpen = () => useUIStore((state) => state.isSearchOpen);
export const useIsFilterOpen = () => useUIStore((state) => state.isFilterOpen);
export const useActiveModal = () => useUIStore((state) => state.activeModal);
