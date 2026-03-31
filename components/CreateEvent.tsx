import { Plus, X, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useUIStore } from "@/store/ui";
import { useRouteStore } from "@/store/routeStore";

export default function CreateEvent() {
    const { openEventForm, setEventFormOpen, isEventFormOpen } = useUIStore();
    const isRoutingMode = useRouteStore((state) => state.isRoutingMode);

    // Hide when in routing mode
    if (isRoutingMode) return null;

    return (

        !isEventFormOpen ? (
            <div className="fixed bottom-12 right-15 z-10 flex flex-col gap-3">
                {/* Help Button */}
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full cursor-pointer bg-white"
                    onClick={() => {
                        import("./map/IntroTour").then(mod => mod.startTour());
                    }}
                    data-intro="¿Necesitas ayuda? Haz clic aquí para ver este recorrido de nuevo."
                    data-step="6"
                >
                    <HelpCircle size={24} />
                </Button>

                {/* Create Event Button */}
                <div 
                    data-intro="Haz clic aquí para crear un nuevo evento. También puedes hacer clic derecho en cualquier parte del mapa."
                    data-step="3"
                >
                    <Button onClick={() => openEventForm()} className="rounded-full cursor-pointer" variant="outline" size="lg"><Plus size={32} /></Button>
                </div>
            </div>
        ) : (
            <div className="fixed bottom-12 right-15 z-10">
                <Button onClick={() => setEventFormOpen(false)} className="rounded-full cursor-pointer" variant="outline" size="lg"><X size={32} /></Button>
            </div>
        )
    )
}