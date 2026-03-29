"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, MapPin } from "lucide-react";
import { useRouteStore } from "@/store/routeStore";

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    street?: string;
    housenumber?: string;
  };
}

function formatName(f: PhotonFeature): string {
  const p = f.properties;
  return p.name || [p.street, p.housenumber].filter(Boolean).join(" ") || "Sin nombre";
}

function formatSubtitle(f: PhotonFeature): string {
  const p = f.properties;
  return [p.city, p.state, p.country].filter(Boolean).join(", ");
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapCenter = useRouteStore((s) => s.mapCenter);
  const setPendingFlyTo = useRouteStore((s) => s.setPendingFlyTo);

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

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            text
          )}&lat=${mapCenter[1]}&lon=${mapCenter[0]}&limit=5`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          setSuggestions(data.features || []);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    },
    [mapCenter]
  );

  const handleSelect = (feature: PhotonFeature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const name = formatName(feature);
    setQuery(name);
    setSuggestions([]);
    setIsFocused(false);
    setPendingFlyTo([lon, lat]);
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className="fixed top-16 left-4 z-30 w-80">
      {/* Search bar */}
      <div className="flex items-center bg-white rounded-lg shadow-lg px-3 py-2.5 border border-zinc-200">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
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
        <ul className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
          {suggestions.map((feature, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(feature)}
              className="px-4 py-3 cursor-pointer hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">
                    {formatName(feature)}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {formatSubtitle(feature)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
