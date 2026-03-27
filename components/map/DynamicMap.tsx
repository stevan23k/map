/**
 * Wrapper de importación dinámica para MapComponent.
 * maplibre-gl usa WebGL y APIs del browser (window/document),
 * por lo que NO puede renderizarse en el servidor (SSR).
 * next/dynamic con ssr: false garantiza que solo cargue en el cliente.
 */
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
        <span className="text-sm font-medium">Cargando mapa...</span>
      </div>
    </div>
  ),
});

export default DynamicMap;
