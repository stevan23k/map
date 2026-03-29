import { create } from "zustand";

export type TransportMode = "driving" | "cycling" | "foot";

export interface RouteWaypoint {
  lngLat: [number, number];
  label: string;
  displayText: string; // User-editable text for the input
}

interface RouteState {
  waypoints: RouteWaypoint[];
  routeInfo: { distance: string; duration: string } | null;
  isRouteMenuOpen: boolean;
  isRoutingMode: boolean;
  transportMode: TransportMode;
  pendingFlyTo: [number, number] | null;
  mapCenter: [number, number]; // [lng, lat] — for Photon biasing

  // Actions
  addWaypoint: (lngLat: [number, number], displayText?: string) => void;
  updateWaypointLngLat: (index: number, lngLat: [number, number], displayText?: string) => void;
  updateWaypointText: (index: number, text: string) => void;
  removeWaypoint: (index: number) => void;
  clearRoute: () => void;
  setRouteInfo: (info: { distance: string; duration: string } | null) => void;
  setRouteMenuOpen: (open: boolean) => void;
  setRoutingMode: (active: boolean) => void;
  setTransportMode: (mode: TransportMode) => void;
  setPendingFlyTo: (lngLat: [number, number]) => void;
  consumePendingFlyTo: () => void;
  setMapCenter: (lngLat: [number, number]) => void;
}

function coordsToText(lngLat: [number, number]): string {
  return `${lngLat[1].toFixed(5)}, ${lngLat[0].toFixed(5)}`;
}

export const useRouteStore = create<RouteState>((set) => ({
  waypoints: [],
  routeInfo: null,
  isRouteMenuOpen: false,
  isRoutingMode: false,
  transportMode: "driving",
  pendingFlyTo: null,
  mapCenter: [-74.7813, 10.9685], // Barranquilla default

  addWaypoint: (lngLat, displayText) =>
    set((state) => ({
      waypoints: [
        ...state.waypoints,
        {
          lngLat,
          label: String.fromCharCode(65 + state.waypoints.length),
          displayText: displayText || coordsToText(lngLat),
        },
      ],
    })),

  updateWaypointLngLat: (index, lngLat, displayText) =>
    set((state) => ({
      waypoints: state.waypoints.map((wp, i) =>
        i === index
          ? { ...wp, lngLat, displayText: displayText || coordsToText(lngLat) }
          : wp
      ),
      // Force route recalculation
      routeInfo: null,
    })),

  updateWaypointText: (index, text) =>
    set((state) => ({
      waypoints: state.waypoints.map((wp, i) =>
        i === index ? { ...wp, displayText: text } : wp
      ),
    })),

  removeWaypoint: (index) =>
    set((state) => {
      const newWaypoints = state.waypoints.filter((_, i) => i !== index);
      return {
        waypoints: newWaypoints.map((wp, i) => ({
          ...wp,
          label: String.fromCharCode(65 + i),
        })),
        routeInfo: newWaypoints.length < 2 ? null : state.routeInfo,
      };
    }),

  clearRoute: () =>
    set({
      waypoints: [],
      routeInfo: null,
      isRouteMenuOpen: false,
    }),

  setRouteInfo: (info) => set({ routeInfo: info }),
  setRouteMenuOpen: (open) => set({ isRouteMenuOpen: open }),
  setRoutingMode: (active) =>
    set({
      isRoutingMode: active,
      ...(active
        ? {}
        : {
            waypoints: [],
            routeInfo: null,
            isRouteMenuOpen: false,
          }),
    }),
  setTransportMode: (mode) => set({ transportMode: mode, routeInfo: null }),
  setPendingFlyTo: (lngLat) => set({ pendingFlyTo: lngLat }),
  consumePendingFlyTo: () => set({ pendingFlyTo: null }),
  setMapCenter: (lngLat) => set({ mapCenter: lngLat }),
}));
