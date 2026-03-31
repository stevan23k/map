"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, MapPin, Building2 } from "lucide-react";
import { useRouteStore } from "@/store/routeStore";
import { hybridGeocode, zoomForPlaceType, rankByRelevance, type GeoResult, type GeocodingBias } from "@/lib/geocoding";

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController ref — cancels in-flight requests when user keeps typing
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapCenter = useRouteStore((s) => s.mapCenter);
  const setPendingFlyTo = useRouteStore((s) => s.setPendingFlyTo);
  const setSelectedLocation = useRouteStore((s) => s.setSelectedLocation);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
      setQuery(text);

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
            // Re-rank: boost results whose numbers match the user's query
            setSuggestions(rankByRelevance(raw, text));
          }
        } catch (err) {
          if (!signal.aborted) {
            console.error("[Geocoding] Search failed:", err);
            setSuggestions([]); // Failed gracefully — clear list instead of crashing
          }
        } finally {
          if (!signal.aborted) setIsSearching(false);
        }
      }, 450);
    },
    [] // no dependency on mapCenter — we read it from store.getState() at fire time
  );

  const handleSelect = (result: GeoResult) => {
    setQuery(result.streetName);
    setSuggestions([]);
    setIsFocused(false);
    setPendingFlyTo(result.coords, zoomForPlaceType(result.placeType));
    setSelectedLocation({
      fullAddress: result.fullAddress,
      street: result.street,
      neighborhood: result.neighborhood,
      coords: result.coords,
      source: result.source,
      placeType: result.placeType,
      // Backward compat
      streetName: result.streetName,
      subtitle: result.subtitle,
      exactCoords: result.exactCoords,
    });
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setSelectedLocation(null);
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Search bar */}
      <div className="flex items-center bg-white rounded-lg shadow-lg px-3 py-2.5 border border-zinc-200">
        {isSearching ? (
          <Search className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
        ) : (
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Buscar en Barranquilla..."
          className="bg-transparent outline-none w-full ml-2 text-sm text-gray-700 placeholder-gray-400"
        />
        {query.length > 0 && (
          <button
            onClick={clearSearch}
            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <ul className="absolute top-full left-0 w-[350px] mt-1.5 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
          {suggestions.map((result, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(result)}
              className="px-4 py-3 cursor-pointer hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                {result.kind === "place" ? (
                  <Building2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-zinc-800 truncate">
                      {result.streetName}
                    </p>
                    {result.source === "mapbox" && (
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-indigo-500 bg-indigo-50 rounded px-1 py-0.5">
                        Exacta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{result.subtitle}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
