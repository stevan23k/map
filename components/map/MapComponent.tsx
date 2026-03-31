"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useUIStore } from "@/store/ui";
import { useSocketStore } from "@/store/socketStore";
import { useRouteStore } from "@/store/routeStore";
import * as LucideIcons from "lucide-react";
import { createRoot } from "react-dom/client";
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// ─── OSRM Route Fetcher ─────────────────────────────────────────────────────
type OSRMProfile = "driving" | "cycling" | "foot";

const OSRM_ENDPOINTS: Record<OSRMProfile, string> = {
  driving: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
  cycling: "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
  foot: "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
};

async function fetchOSRMRoute(waypoints: [number, number][], profile: OSRMProfile = "driving") {
  const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const base = OSRM_ENDPOINTS[profile];
  const url = `${base}/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM request failed");

  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No route found");

  const route = data.routes[0];
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.ceil(route.duration / 60);

  return {
    geometry: route.geometry,
    distance: `${distanceKm} km`,
    duration: `${durationMin} min`,
  };
}

// Marker colors for route waypoints
const WAYPOINT_COLORS = {
  first: "#10b981",  // green
  last: "#ef4444",   // red
  mid: "#6366f1",    // indigo
};

const BARRANQUILLA_CENTER: [number, number] = [-74.7813, 10.9685];
const DEFAULT_ZOOM = 14;
const CARTO_VOYAGER_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

interface MapComponentProps {
  className?: string;
}

export default function MapComponent({ className }: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectionMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Refs to track dynamic markers
  const eventMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const userMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [lastRightClickCoords, setLastRightClickCoords] = useState<{ lng: number, lat: number } | null>(null);

  const user = useAuthStore(state => state.user);

  // Route marker refs
  const routeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const styleLoadedRef = useRef(false);

  const { setEventFormOpen, setSelectedLocation, isEventFormOpen, selectedLocation, setSelectedEvent, openEventForm } = useUIStore();
  const events = useSocketStore((state) => state.events);
  const otherUsers = useSocketStore((state) => state.otherUsers);
  const emitUpdateLocation = useSocketStore((state) => state.emitUpdateLocation);

  // Route store
  const isRoutingMode = useRouteStore((state) => state.isRoutingMode);
  const waypoints = useRouteStore((state) => state.waypoints);
  const addWaypoint = useRouteStore((state) => state.addWaypoint);
  const setRouteInfo = useRouteStore((state) => state.setRouteInfo);
  const setRouteMenuOpen = useRouteStore((state) => state.setRouteMenuOpen);
  const clearRoute = useRouteStore((state) => state.clearRoute);
  const transportMode = useRouteStore((state) => state.transportMode);
  const pendingFlyTo = useRouteStore((state) => state.pendingFlyTo);
  const consumePendingFlyTo = useRouteStore((state) => state.consumePendingFlyTo);

  // FlyTo when a geocode sets pendingFlyTo
  useEffect(() => {
    if (pendingFlyTo && mapRef.current) {
      mapRef.current.flyTo({ center: pendingFlyTo, zoom: 14, duration: 800 });
      consumePendingFlyTo();
    }
  }, [pendingFlyTo]);

  // Cleanup marker when selection is cleared
  useEffect(() => {
    if (!selectedLocation && selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }
  }, [selectedLocation]);

  // Mutual exclusion: routing mode ↔ event form
  useEffect(() => {
    if (isRoutingMode) {
      // Close event form and clear selection marker when entering routing mode
      setEventFormOpen(false);
      setSelectedLocation(null);
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.remove();
        selectionMarkerRef.current = null;
      }
    }
  }, [isRoutingMode]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Fetch style and inject projection for MapLibre v5 compatibility
    fetch(CARTO_VOYAGER_STYLE)
      .then((r) => r.json())
      .then((styleJson) => {
        if (!containerRef.current) return;

        styleJson.projection = styleJson.projection || { type: "mercator" };

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: styleJson,
          center: BARRANQUILLA_CENTER,
          zoom: DEFAULT_ZOOM,
        });

        map.on("load", () => {
          console.log("Map fully loaded");
          setMapLoaded(true);
        });

        mapRef.current = map;

        map.on("load", () => {
          styleLoadedRef.current = true;
        });

        // Geolocation for socket emission
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            (pos) => {
              emitUpdateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            undefined,
            { enableHighAccuracy: true }
          );
        }

        // Track map center for Photon location biasing
        map.on("moveend", () => {
          const c = map.getCenter();
          useRouteStore.getState().setMapCenter([c.lng, c.lat]);
        });

        map.on("click", (e) => {
          const routingActive = useRouteStore.getState().isRoutingMode;
          if (routingActive) {
            const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
            useRouteStore.getState().addWaypoint(lngLat);
          }
        });
      });
    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      selectionMarkerRef.current?.remove();

      // Cleanup dynamic markers
      Object.values(eventMarkersRef.current).forEach(m => m.remove());
      Object.values(userMarkersRef.current).forEach(m => m.remove());
      routeMarkersRef.current.forEach(m => m.remove());
    };
  }, []);

  // ─── Context Menu (right-click to create event) ─────────────────────────
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert screen coordinates to map container coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lngLat = mapRef.current.unproject([x, y]);
    setLastRightClickCoords({ lng: lngLat.lng, lat: lngLat.lat });
  };

  const handleCreateEvent = () => {
    if (!lastRightClickCoords || !mapRef.current) return;

    // Set selected location and open form
    openEventForm(lastRightClickCoords);

    // Create and store the new selection marker
    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
    }

    selectionMarkerRef.current = new maplibregl.Marker()
      .setLngLat([lastRightClickCoords.lng, lastRightClickCoords.lat])
      .addTo(mapRef.current);
  };

  // ─── Sync Route Waypoints & Draw Route ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    // 1. Clear old route markers
    routeMarkersRef.current.forEach((m) => m.remove());
    routeMarkersRef.current = [];

    // If routing mode is off, clean the line too
    if (!isRoutingMode) {
      try {
        if (map.getLayer("osrm-route-line")) map.removeLayer("osrm-route-line");
        if (map.getSource("osrm-route")) map.removeSource("osrm-route");
      } catch { /* style not ready */ }
      return;
    }

    // 2. Draw new route markers
    waypoints.forEach((wp, i) => {
      const isFirst = i === 0;
      const isLast = i === waypoints.length - 1 && waypoints.length > 1;

      const color = isFirst
        ? WAYPOINT_COLORS.first
        : isLast
          ? WAYPOINT_COLORS.last
          : WAYPOINT_COLORS.mid;

      // Custom marker element
      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; color: white;
        font-family: system-ui, sans-serif;
      `;
      el.textContent = wp.label;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(wp.lngLat)
        .addTo(map);

      routeMarkersRef.current.push(marker);
    });

    // 3. Fetch route if 2+ waypoints
    if (waypoints.length >= 2) {
      const coords = waypoints.map((wp) => wp.lngLat);

      fetchOSRMRoute(coords, transportMode)
        .then(({ geometry, distance, duration }) => {
          setRouteInfo({ distance, duration });
          setRouteMenuOpen(true);

          // Draw / update geojson line
          const sourceData: GeoJSON.Feature = {
            type: "Feature",
            properties: {},
            geometry,
          };

          if (map.getSource("osrm-route")) {
            (map.getSource("osrm-route") as maplibregl.GeoJSONSource).setData(
              sourceData
            );
          } else {
            map.addSource("osrm-route", {
              type: "geojson",
              data: sourceData,
            });
            map.addLayer({
              id: "osrm-route-line",
              type: "line",
              source: "osrm-route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#6366f1",
                "line-width": 5,
                "line-opacity": 0.85,
              },
            });
          }

          // Fit bounds to route
          const allCoords = geometry.coordinates as [number, number][];
          const bounds = allCoords.reduce(
            (b, c) => b.extend(c),
            new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
          );
          map.fitBounds(bounds, { padding: 60, duration: 600 });
        })
        .catch((err) => {
          console.error("OSRM route error:", err);
          setRouteInfo(null);
        });
    } else {
      // Less than 2 waypoints — remove line if exists
      if (map.getLayer("osrm-route-line")) map.removeLayer("osrm-route-line");
      if (map.getSource("osrm-route")) map.removeSource("osrm-route");
      setRouteInfo(null);
    }
  }, [waypoints, isRoutingMode, transportMode]);

  // Cleanup route visuals when routing mode is turned off
  useEffect(() => {
    if (!isRoutingMode && mapRef.current && styleLoadedRef.current) {
      routeMarkersRef.current.forEach((m) => m.remove());
      routeMarkersRef.current = [];
      const map = mapRef.current;
      try {
        if (map.getLayer("osrm-route-line")) map.removeLayer("osrm-route-line");
        if (map.getSource("osrm-route")) map.removeSource("osrm-route");
      } catch { /* style not ready */ }
    }
  }, [isRoutingMode]);

  // Sync Event Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    console.log("Syncing event markers, current events count:", events.length);

    // Create new markers or skip existing
    events.forEach(event => {
      if (!eventMarkersRef.current[event.id]) {
        console.log("Creating marker for event:", event.title, "at", event.lat, event.lng);
        const el = document.createElement('div');

        // Check if event belongs to current user
        const isOwner = user && (event.userId === user.sub || event.userId === user.id);

        el.className = `flex items-center justify-center rounded-full w-8 h-8 shadow-lg border-2 pointer-events-auto 
        ${isOwner ? 'bg-blue-500 text-primary-foreground border-white' : 'bg-primary text-primary-foreground border-black/50'
          }`;
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';

        // Render icon
        const IconComponent = (LucideIcons as any)[event.icon] || LucideIcons.MapPin;
        const root = createRoot(el);
        root.render(React.createElement(IconComponent as React.FC<any>, { size: 18, style: { pointerEvents: 'none' } }));

        // Click handler to select event
        el.addEventListener('click', (e) => {
          console.log("Marker clicked:", event.title);
          e.stopPropagation();
          setSelectedEvent(event);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([event.lng, event.lat])
          .addTo(mapRef.current!);

        eventMarkersRef.current[event.id] = marker;
      }
    });

    // Remove stale markers
    const eventIds = new Set(events.map(e => e.id));
    Object.keys(eventMarkersRef.current).forEach(id => {
      if (!eventIds.has(id)) {
        eventMarkersRef.current[id].remove();
        delete eventMarkersRef.current[id];
      }
    });
  }, [events, mapLoaded]);

  // Sync Other User Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    Object.values(otherUsers).forEach(userData => {
      if (!userMarkersRef.current[userData.userId]) {
        const el = document.createElement('div');
        el.className = 'w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full shadow-md border-2 border-white';

        const root = createRoot(el);
        root.render(React.createElement(LucideIcons.User, { size: 16 }));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([userData.lng, userData.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 })
            .setHTML(`<strong>${userData.username}</strong>`)
          )
          .addTo(mapRef.current!);

        userMarkersRef.current[userData.userId] = marker;
      } else {
        // Update existing marker position
        userMarkersRef.current[userData.userId].setLngLat([userData.lng, userData.lat]);
      }
    });

    // Remove inactive users
    const userIds = new Set(Object.keys(otherUsers));
    Object.keys(userMarkersRef.current).forEach(id => {
      if (!userIds.has(id)) {
        userMarkersRef.current[id].remove();
        delete userMarkersRef.current[id];
      }
    });
  }, [otherUsers, mapLoaded]);

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu} className="w-full h-full block">
        <div
          ref={containerRef}
          className={className ?? "w-full h-full"}
          aria-label="Mapa interactivo de Barranquilla"
        />
      </ContextMenuTrigger>
      {user && (
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleCreateEvent} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Crear evento aquí</span>
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
