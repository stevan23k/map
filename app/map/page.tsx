"use client";

import DynamicMap from "@/components/map/DynamicMap";

export default function MapPage() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <DynamicMap className="w-full h-full" />
    </main>
  );
}