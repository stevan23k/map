import { create } from 'zustand';

interface UIState {
    isEventFormOpen: boolean;
    selectedLocation: { lng: number; lat: number } | null;
    setEventFormOpen: (open: boolean) => void;
    setSelectedLocation: (location: { lng: number; lat: number } | null) => void;
    resetEventForm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isEventFormOpen: false,
    selectedLocation: null,
    setEventFormOpen: (open) => set({ isEventFormOpen: open }),
    setSelectedLocation: (location) => set({ selectedLocation: location }),
    resetEventForm: () => set({ isEventFormOpen: false, selectedLocation: null }),
}));
