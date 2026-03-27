"use client";

import DynamicMap from "@/components/map/DynamicMap";
import MapHeader from "@/components/map/Header";

export default function MapPage() {
  return (
    <>
      <MapHeader />
      <main className="w-screen h-screen overflow-hidden">
        <DynamicMap className="w-full h-full" />
      </main>
    </>
  );
}