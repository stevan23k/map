"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouteStore, type TransportMode } from "@/store/routeStore";
import {
  Navigation,
  X,
  Trash2,
  Clock,
  MapPin,
  ChevronUp,
  Car,
  Bike,
  Footprints,
  CircleDot,
  Circle,
  Plus,
  Route,
  Crosshair,
  Loader2,
  Search,
} from "lucide-react";

// ─── Photon autocomplete fetcher ─────────────────────────────────────────────
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
  };
}

async function searchPhoton(
  query: string,
  center: [number, number],
  limit = 5
): Promise<PhotonFeature[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    query
  )}&lat=${center[1]}&lon=${center[0]}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.features || [];
  } catch {
    return [];
  }
}

function formatPhotonName(f: PhotonFeature): string {
  const p = f.properties;
  return p.name || [p.street, p.housenumber].filter(Boolean).join(" ") || "Sin nombre";
}

function formatPhotonSubtitle(f: PhotonFeature): string {
  const p = f.properties;
  return [p.city, p.state, p.country].filter(Boolean).join(", ");
}

// ─── Transport options ───────────────────────────────────────────────────────
const TRANSPORT_OPTIONS: {
  mode: TransportMode;
  label: string;
  icon: typeof Car;
}[] = [
  { mode: "driving", label: "Auto", icon: Car },
  { mode: "cycling", label: "Bicicleta", icon: Bike },
  { mode: "foot", label: "A pie", icon: Footprints },
];

// ─── Reusable autocomplete input ─────────────────────────────────────────────
interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (lngLat: [number, number], name: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  rightSlot?: React.ReactNode;
  mapCenter: [number, number];
}

function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
  isLoading,
  rightSlot,
  mapCenter,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      onChange(text);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const results = await searchPhoton(text, mapCenter);
        setSuggestions(results);
      }, 300);
    },
    [mapCenter, onChange]
  );

  const handleSelect = (feature: PhotonFeature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const name = formatPhotonName(feature);
    onSelect([lon, lat], name);
    onChange(name);
    setSuggestions([]);
    setIsFocused(false);
  };

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className="flex items-center gap-2 group relative">
      {icon}
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-100 border border-transparent focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition-colors"
        />
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        {/* Suggestions dropdown */}
        {showSuggestions && (
          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
            {suggestions.map((feature, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(feature)}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 text-sm flex flex-col transition-colors"
              >
                <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-zinc-400 shrink-0" />
                  {formatPhotonName(feature)}
                </span>
                <span className="text-xs text-zinc-400 ml-[18px]">
                  {formatPhotonSubtitle(feature)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

// ─── Main RoutePanel ─────────────────────────────────────────────────────────
export default function RoutePanel() {
  const {
    waypoints,
    routeInfo,
    isRouteMenuOpen,
    isRoutingMode,
    transportMode,
    mapCenter,
    setRouteMenuOpen,
    clearRoute,
    setRoutingMode,
    removeWaypoint,
    setTransportMode,
    updateWaypointLngLat,
    updateWaypointText,
    addWaypoint,
    setPendingFlyTo,
  } = useRouteStore();

  // Local text for inputs without a waypoint yet
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");

  // Select handler for inputs bound to existing waypoints
  const handleSelectExisting = (
    index: number,
    lngLat: [number, number],
    name: string
  ) => {
    updateWaypointLngLat(index, lngLat, name);
    setPendingFlyTo(lngLat);
  };

  // Select handler for empty inputs (create new waypoint)
  const handleSelectNew = (
    lngLat: [number, number],
    name: string,
    clearLocal: () => void
  ) => {
    addWaypoint(lngLat, name);
    clearLocal();
    setPendingFlyTo(lngLat);
  };

  // ─── Inactive: floating RUTA button ────────────────────────────────────────
  if (!isRoutingMode) {
    return (
      <div className="fixed bottom-12 left-6 z-10">
        <button
          onClick={() => setRoutingMode(true)}
          className="bg-white text-indigo-600 font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer border border-zinc-200"
        >
          <Navigation size={18} />
          <span className="text-sm">RUTA</span>
        </button>
      </div>
    );
  }

  const hasRoute = routeInfo !== null;
  const hasWaypoints = waypoints.length > 0;

  // ─── Collapsed pill ────────────────────────────────────────────────────────
  if (!isRouteMenuOpen && hasRoute) {
    return (
      <div className="fixed bottom-12 left-6 z-10">
        <button
          onClick={() => setRouteMenuOpen(true)}
          className="flex items-center gap-2.5 bg-white rounded-full shadow-lg border border-zinc-200 px-5 py-3 hover:shadow-xl transition-shadow cursor-pointer"
        >
          {transportMode === "driving" && (
            <Car className="w-4 h-4 text-indigo-600" />
          )}
          {transportMode === "cycling" && (
            <Bike className="w-4 h-4 text-indigo-600" />
          )}
          {transportMode === "foot" && (
            <Footprints className="w-4 h-4 text-indigo-600" />
          )}
          <span className="text-sm font-bold text-zinc-800">
            {routeInfo.duration}
          </span>
          <span className="text-xs text-zinc-300">|</span>
          <span className="text-sm text-zinc-500">{routeInfo.distance}</span>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    );
  }

  // ─── Data slicing ──────────────────────────────────────────────────────────
  const originWp = waypoints.length >= 1 ? waypoints[0] : null;
  const destWp = waypoints.length >= 2 ? waypoints[waypoints.length - 1] : null;
  const intermediates = waypoints.length >= 3 ? waypoints.slice(1, -1) : [];

  // ─── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 left-6 z-20 w-[360px]">
      <div className="bg-white rounded-xl shadow-lg border border-zinc-200 h-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-zinc-800 tracking-tight">
              Planificar ruta
            </h3>
          </div>
          <button
            onClick={() => setRoutingMode(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transport selector */}
        <div className="mb-3">
          <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
            {TRANSPORT_OPTIONS.map(({ mode, label, icon: Icon }) => {
              const isActive = transportMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setTransportMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direction inputs */}
        <div className="space-y-2">
          {/* Origin */}
          <AutocompleteInput
            value={originWp ? originWp.displayText : originText}
            onChange={
              originWp
                ? (val) => updateWaypointText(0, val)
                : (val) => setOriginText(val)
            }
            onSelect={
              originWp
                ? (lngLat, name) => handleSelectExisting(0, lngLat, name)
                : (lngLat, name) =>
                    handleSelectNew(lngLat, name, () => setOriginText(""))
            }
            placeholder="Origen — busca una dirección"
            icon={
              <CircleDot className="w-4 h-4 shrink-0 text-emerald-500" />
            }
            mapCenter={mapCenter}
            rightSlot={
              <>
                <button
                  onClick={() => console.log("Obtener ubicación")}
                  title="Usar mi ubicación"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
                {originWp && (
                  <button
                    onClick={() => removeWaypoint(0)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </>
            }
          />

          {/* Intermediate stops */}
          {intermediates.length > 0 && (
            <div
              className={`space-y-2 ${
                intermediates.length > 2
                  ? "max-h-[100px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                  : ""
              }`}
            >
              {intermediates.map((wp, idx) => {
                const realIndex = idx + 1;
                return (
                  <AutocompleteInput
                    key={realIndex}
                    value={wp.displayText}
                    onChange={(val) => updateWaypointText(realIndex, val)}
                    onSelect={(lngLat, name) =>
                      handleSelectExisting(realIndex, lngLat, name)
                    }
                    placeholder={`Parada ${wp.label}`}
                    icon={
                      <Circle className="w-4 h-4 shrink-0 text-indigo-400" />
                    }
                    mapCenter={mapCenter}
                    rightSlot={
                      <button
                        onClick={() => removeWaypoint(realIndex)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}

          {/* Destination */}
          <AutocompleteInput
            value={destWp ? destWp.displayText : destText}
            onChange={
              destWp
                ? (val) =>
                    updateWaypointText(waypoints.length - 1, val)
                : (val) => setDestText(val)
            }
            onSelect={
              destWp
                ? (lngLat, name) =>
                    handleSelectExisting(waypoints.length - 1, lngLat, name)
                : (lngLat, name) =>
                    handleSelectNew(lngLat, name, () => setDestText(""))
            }
            placeholder="Destino — busca una dirección"
            icon={<MapPin className="w-4 h-4 shrink-0 text-red-500" />}
            mapCenter={mapCenter}
            rightSlot={
              destWp ? (
                <button
                  onClick={() => removeWaypoint(waypoints.length - 1)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Add stop hint */}
        {hasWaypoints && (
          <p className="text-indigo-600 text-xs font-medium flex items-center gap-1 mt-3 cursor-default select-none">
            <Plus className="w-3.5 h-3.5" />
            Toca el mapa para añadir parada
          </p>
        )}

        {/* Route summary */}
        {hasRoute && (
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <Route className="w-4 h-4 text-indigo-600" />
              <span className="text-base font-bold text-zinc-800">
                {routeInfo.distance}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-base font-bold text-zinc-800">
                {routeInfo.duration}
              </span>
            </div>
          </div>
        )}

        {/* Clear button */}
        {hasWaypoints && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <button
              onClick={clearRoute}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar ruta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
