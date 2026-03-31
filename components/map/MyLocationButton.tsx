"use client";
import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { reverseGeocode } from "@/lib/geocoding";
import { useRouteStore } from "@/store/routeStore";

export default function MyLocationButton() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const setPendingFlyTo = useRouteStore((s) => s.setPendingFlyTo);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no es soportada por este navegador.");
      return;
    }

    setLoading(true);
    setAddress(null); // Reset address

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        // Fly to user location
        setPendingFlyTo(lngLat, 18);
        
        try {
          // Obtener nombre de la via para mostrarla de referencia
          const streetName = await reverseGeocode(lngLat);
          setAddress(streetName || `Lat: ${lngLat[1].toFixed(4)}, Lng: ${lngLat[0].toFixed(4)}`);

          // Ocultar mensaje después de 10 segundos
          setTimeout(() => setAddress(null), 10000);
        } catch {
          setAddress("No se pudo resolver la dirección");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        alert("No se pudo obtener la ubicación. Asegúrate de haber dado los permisos necesarios en el navegador.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed bottom-28 left-6 z-10 flex flex-col items-start gap-2">
      {address && (
        <div className="bg-zinc-800/95 dark:bg-zinc-900/95 backdrop-blur-xl text-zinc-100 px-3 py-2 rounded-lg shadow-xl text-sm font-semibold border border-zinc-700 animate-in fade-in slide-in-from-bottom-2 mb-1">
          📍 Estás en: <span className="text-emerald-400">{address}</span>
        </div>
      )}
      <button
        onClick={handleGeolocate}
        disabled={loading}
        title="Ver mi dirección actual"
        className="w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-indigo-600 dark:text-indigo-400 font-bold rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/90 transition-all cursor-pointer disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-[22px] h-[22px]" />}
      </button>
    </div>
  );
}
