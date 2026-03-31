import { create } from "zustand";

export type TransportMode = "driving" | "cycling" | "foot";

export interface RouteWaypoint {
  lngLat: [number, number];
  label: string;
  displayText: string; // User-editable text for the input
  /** Clean street name ready for the backend (e.g. "Calle 72 # 46-35") */
  streetName?: string;
  /** Canonical coordinates from the geocoder — more precise than click coords */
  exactCoords?: [number, number];
}

/** The last geocoder pick from the global search bar — backend-ready */
export interface SelectedLocation {
  /** Full composed address: "Carrera 43 #84, El Poblado, Barranquilla" */
  fullAddress: string;
  /** Street component: "Carrera 43 #84" */
  street: string;
  /** Neighborhood / barrio: "El Poblado" */
  neighborhood: string;
  /** [lng, lat] coordinates */
  coords: [number, number];
  /** API source: "mapbox" | "photon" */
  source: string;
  /** Specific place type: "house", "address", "park", "stadium", etc. */
  placeType: string;

  // ── Backward compat aliases ─────────────────────────────────────────────
  /** @alias street */
  streetName: string;
  /** @alias neighborhood + city */
  subtitle: string;
  /** @alias coords */
  exactCoords: [number, number];
}

interface RouteState {
  waypoints: RouteWaypoint[];
  routeInfo: { distance: string; duration: string } | null;
  isRouteMenuOpen: boolean;
  isRoutingMode: boolean;
  transportMode: TransportMode;
  pendingFlyTo: { center: [number, number]; zoom: number } | null;
  mapCenter: [number, number]; // [lng, lat] — for Photon biasing
  /** Last location picked from GlobalSearchBar — ready for the backend */
  selectedLocation: SelectedLocation | null;
  userLocation: [number, number] | null; // [lng, lat]

  // Actions
  setUserLocation: (lngLat: [number, number] | null) => void;
  addWaypoint: (lngLat: [number, number], displayText?: string, streetName?: string) => void;
  updateWaypointLngLat: (index: number, lngLat: [number, number], displayText?: string, streetName?: string) => void;
  updateWaypointText: (index: number, text: string) => void;
  removeWaypoint: (index: number) => void;
  clearRoute: () => void;
  setRouteInfo: (info: { distance: string; duration: string } | null) => void;
  setRouteMenuOpen: (open: boolean) => void;
  setRoutingMode: (active: boolean) => void;
  setTransportMode: (mode: TransportMode) => void;
  setPendingFlyTo: (lngLat: [number, number], zoom?: number) => void;
  consumePendingFlyTo: () => void;
  setMapCenter: (lngLat: [number, number]) => void;
  setSelectedLocation: (loc: SelectedLocation | null) => void;
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
  selectedLocation: null,
  userLocation: null,

  addWaypoint: (lngLat, displayText, streetName) =>
    set((state) => ({
      waypoints: [
        ...state.waypoints,
        {
          lngLat,
          label: String.fromCharCode(65 + state.waypoints.length),
          displayText: displayText || coordsToText(lngLat),
          streetName: streetName || displayText,
          exactCoords: lngLat,
        },
      ],
    })),

  updateWaypointLngLat: (index, lngLat, displayText, streetName) =>
    set((state) => ({
      waypoints: state.waypoints.map((wp, i) =>
        i === index
          ? {
              ...wp,
              lngLat,
              displayText: displayText || coordsToText(lngLat),
              streetName: streetName || displayText,
              exactCoords: lngLat,
            }
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
  setPendingFlyTo: (lngLat, zoom = 18) => set({ pendingFlyTo: { center: lngLat, zoom } }),
  consumePendingFlyTo: () => set({ pendingFlyTo: null }),
  setMapCenter: (lngLat) => set({ mapCenter: lngLat }),
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
  setUserLocation: (lngLat) => set({ userLocation: lngLat }),
}));
