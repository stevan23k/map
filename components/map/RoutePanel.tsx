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

// ─── Hybrid geocoding ────────────────────────────────────────────────────────
import { hybridGeocode, zoomForPlaceType, rankByRelevance, reverseGeocode, type GeoResult, type GeocodingBias } from "@/lib/geocoding";

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
  onSelect: (lngLat: [number, number], name: string, streetName: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  rightSlot?: React.ReactNode;
  // mapCenter is kept in props for stable rendering; actual bias is read from
  // store.getState() at fire time so it’s always the freshest value.
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
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController — cancels stale in-flight requests when user types fast
  const abortRef = useRef<AbortController | null>(null);
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

  // Cleanup abort controller on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleChange = useCallback(
    (text: string) => {
      onChange(text);

      // Cancel previous debounce timer
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 5) {
        setSuggestions([]);
        return;
      }

      // 450 ms debounce — lets the user finish typing before firing
      debounceRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const { signal } = abortRef.current;

        const center = useRouteStore.getState().mapCenter;
        const bias: GeocodingBias = { lng: center[0], lat: center[1] };

        setIsSearching(true);
        try {
          const raw = await hybridGeocode(text, bias, signal);
          if (!signal.aborted) {
            setSuggestions(rankByRelevance(raw, text));
          }
        } catch (err) {
          if (!signal.aborted) {
            console.error("[Geocoding] RoutePanel search failed:", err);
            setSuggestions([]);
          }
        } finally {
          if (!signal.aborted) setIsSearching(false);
        }
      }, 450);
    },
    [onChange] // mapCenter omitted — always fetched fresh via getState()
  );

  const handleSelect = (result: GeoResult) => {
    onSelect(result.exactCoords, result.streetName, result.streetName);
    onChange(result.streetName);
    setSuggestions([]);
    setIsFocused(false);
  };

  const showSuggestions = isFocused && suggestions.length > 0;
  const isSpinning = isLoading || isSearching;

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
          className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors"
        />
        {isSpinning && (
          <Loader2 className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        {/* Suggestions dropdown */}
        {showSuggestions && (
          <ul className="absolute z-50 w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
            {suggestions.map((result, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(result)}
                className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer border-b border-gray-100 dark:border-zinc-700 last:border-0 text-sm flex items-start gap-2.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {result.streetName}
                    </span>
                    {result.source === "mapbox" && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 rounded px-1.5 py-0.5">
                        Exacta
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate block">
                    {result.subtitle}
                  </span>
                </div>
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
    name: string,
    streetName: string
  ) => {
    updateWaypointLngLat(index, lngLat, name, streetName);
    setPendingFlyTo(lngLat, zoomForPlaceType("address"));
  };

  // Select handler for empty inputs (create new waypoint)
  const handleSelectNew = (
    lngLat: [number, number],
    name: string,
    streetName: string,
    clearLocal: () => void
  ) => {
    addWaypoint(lngLat, name, streetName);
    clearLocal();
    setPendingFlyTo(lngLat, zoomForPlaceType("address"));
  };

  const handleUseMyLocationForOrigin = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        const streetName = (await reverseGeocode(lngLat)) || "Mi ubicación";
        
        if (waypoints.length >= 1) {
          handleSelectExisting(0, lngLat, streetName, streetName);
        } else {
          handleSelectNew(lngLat, streetName, streetName, () => setOriginText(""));
        }
      },
      () => alert("No pudimos acceder a tu ubicación. Verifica tus permisos."),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // ─── Inactive: floating RUTA button ────────────────────────────────────────
  if (!isRoutingMode) {
    return (
      <div className="fixed bottom-6 sm:bottom-12 left-4 sm:left-6 z-10">
        <button
          onClick={() => setRoutingMode(true)}
          className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-indigo-600 dark:text-indigo-400 font-bold px-5 py-3.5 rounded-full shadow-lg flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-zinc-700/90 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700"
        >
          <Navigation size={18} />
          <span className="text-sm tracking-wide">RUTA</span>
        </button>
      </div>
    );
  }

  const hasRoute = routeInfo !== null;
  const hasWaypoints = waypoints.length > 0;

  // ─── Collapsed pill ────────────────────────────────────────────────────────
  if (!isRouteMenuOpen && hasRoute) {
    return (
      <div className="fixed bottom-6 sm:bottom-12 left-4 sm:left-6 z-10">
        <button
          onClick={() => setRouteMenuOpen(true)}
          className="flex items-center gap-2.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 px-5 py-3 hover:shadow-xl transition-shadow cursor-pointer"
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
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {routeInfo.duration}
          </span>
          <span className="text-xs text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{routeInfo.distance}</span>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
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
    <div className="fixed bottom-0 sm:bottom-6 left-0 sm:left-6 z-20 w-full sm:w-[360px]">
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700/60 h-auto p-4 sm:p-4 pb-8 sm:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
              Planificar ruta
            </h3>
          </div>
          <button
            onClick={() => setRoutingMode(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Transport selector */}
        <div className="mb-3">
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
            {TRANSPORT_OPTIONS.map(({ mode, label, icon: Icon }) => {
              const isActive = transportMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setTransportMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
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
                ? (lngLat, name, streetName) => handleSelectExisting(0, lngLat, name, streetName)
                : (lngLat, name, streetName) =>
                    handleSelectNew(lngLat, name, streetName, () => setOriginText(""))
            }
            placeholder="Origen — busca una dirección"
            icon={
              <CircleDot className="w-4 h-4 shrink-0 text-emerald-500" />
            }
            mapCenter={mapCenter}
            rightSlot={
              <>
                <button
                  onClick={handleUseMyLocationForOrigin}
                  title="Usar mi ubicación"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer shrink-0"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
                {originWp && (
                  <button
                    onClick={() => removeWaypoint(0)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer shrink-0"
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
                    onSelect={(lngLat, name, streetName) =>
                      handleSelectExisting(realIndex, lngLat, name, streetName)
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
                ? (lngLat, name, streetName) =>
                    handleSelectExisting(waypoints.length - 1, lngLat, name, streetName)
                : (lngLat, name, streetName) =>
                    handleSelectNew(lngLat, name, streetName, () => setDestText(""))
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
          <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1 mt-3 cursor-default select-none">
            <Plus className="w-3.5 h-3.5" />
            Toca el mapa para añadir parada
          </p>
        )}

        {/* Route summary */}
        {hasRoute && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <Route className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                {routeInfo.distance}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                {routeInfo.duration}
              </span>
            </div>
          </div>
        )}

        {/* Clear button */}
        {hasWaypoints && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60">
            <button
              onClick={clearRoute}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
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
