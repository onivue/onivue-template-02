'use client';

import { create } from 'zustand';

type UiState = {
	isSidebarOpen: boolean;
	openSidebar: () => void;
	closeSidebar: () => void;
};

export const useUiStore = create<UiState>()((set) => ({
	isSidebarOpen: false,
	openSidebar: () => set({ isSidebarOpen: true }),
	closeSidebar: () => set({ isSidebarOpen: false }),
}));
