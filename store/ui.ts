import { create } from 'zustand';
import { Event } from './socketStore';

interface UIState {
    isEventFormOpen: boolean;
    isEventInfoOpen: boolean;
    selectedLocation: { lng: number; lat: number } | null;
    selectedEvent: Event | null;

    setEventFormOpen: (open: boolean) => void;
    setEventInfoOpen: (open: boolean) => void;
    setSelectedLocation: (location: { lng: number; lat: number } | null) => void;
    setSelectedEvent: (event: Event | null) => void;
    openEventForm: (location?: { lat: number; lng: number } | null) => void;
    resetEventForm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isEventFormOpen: false,
    isEventInfoOpen: false,
    selectedLocation: null,
    selectedEvent: null,

    setEventFormOpen: (open) => set((state) => ({
        isEventFormOpen: open,
        // Close info if form is opening
        isEventInfoOpen: open ? false : state.isEventInfoOpen
    })),
    setEventInfoOpen: (open) => set((state) => ({
        isEventInfoOpen: open,
        // Close form if info is opening
        isEventFormOpen: open ? false : state.isEventFormOpen
    })),
    setSelectedLocation: (location) => set({ selectedLocation: location }),
    setSelectedEvent: (event) => set({
        selectedEvent: event,
        isEventInfoOpen: !!event,
        isEventFormOpen: false
    }),
    openEventForm: (location) => set({
        isEventFormOpen: true,
        isEventInfoOpen: false,
        selectedEvent: null,
        selectedLocation: location ?? null,
    }),
    resetEventForm: () => set({
        isEventFormOpen: false,
        isEventInfoOpen: false,
        selectedLocation: null,
        selectedEvent: null
    }),
}));
