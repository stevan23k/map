"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useUIStore } from "@/store/ui";

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
  const { setEventFormOpen, setSelectedLocation, isEventFormOpen, selectedLocation } = useUIStore();

  // Cleanup marker when selection is cleared
  useEffect(() => {
    if (!selectedLocation && selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_VOYAGER_STYLE,
      center: BARRANQUILLA_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    // Navigation controls (zoom +/-)
    mapRef.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right"
    );

    // Current location button
    mapRef.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "bottom-right"
    );

    // Scale bar
    mapRef.current.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left"
    );

    mapRef.current.on("click", (e) => {
      // Remove previous marker if exists
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.remove();
      }

      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setSelectedLocation({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      setEventFormOpen(true);

      // Create and store the new marker
      selectionMarkerRef.current = new maplibregl.Marker()
        .setLngLat(lngLat)
        .addTo(mapRef.current!);
    });

    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      selectionMarkerRef.current?.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "w-full h-full"}
      aria-label="Mapa interactivo de Barranquilla"
    />
  );
}
