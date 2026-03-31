import { Plus, X } from "lucide-react";
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
            <div className="fixed bottom-12 right-15 z-10">
                <Button onClick={() => openEventForm()} className="rounded-full cursor-pointer" variant="outline" size="lg"><Plus size={32} /></Button>
            </div>
        ) : (
            <div className="fixed bottom-12 right-15 z-10">
                <Button onClick={() => setEventFormOpen(false)} className="rounded-full cursor-pointer" variant="outline" size="lg"><X size={32} /></Button>
            </div>
        )
    )
}