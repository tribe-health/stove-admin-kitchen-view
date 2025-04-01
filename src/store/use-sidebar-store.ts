
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  expanded: boolean;
  mobileOpen: boolean;
  toggleExpanded: () => void;
  toggleMobileOpen: () => void;
  setExpanded: (expanded: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      mobileOpen: false,
      toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
      toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      setExpanded: (expanded) => set({ expanded }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);
