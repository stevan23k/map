"use client";

import CreateEvent from "@/components/CreateEvent";
import DynamicMap from "@/components/map/DynamicMap";
import FormEvents from "@/components/map/FormEvents";
import MapHeader from "@/components/map/Header";
import RoutePanel from "@/components/map/RoutePanel";
import GlobalSearchBar from "@/components/map/GlobalSearchBar";

export default function MapPage() {
  return (
    <>
      <MapHeader />
      <main className="w-screen h-screen overflow-hidden">
        <DynamicMap className="w-full h-full" />
        <GlobalSearchBar />
        <CreateEvent />
        <FormEvents />
        <RoutePanel />
      </main>
    </>
  );
}