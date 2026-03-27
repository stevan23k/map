"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

    // Cleanup on unmount — prevents WebGL context leaks
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
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
