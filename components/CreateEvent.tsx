import { Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { useUIStore } from "@/store/ui";

export default function CreateEvent() {
    const { setEventFormOpen } = useUIStore();
    const { isEventFormOpen } = useUIStore();
    return (

        !isEventFormOpen ? (
            <div className="fixed bottom-12 right-15 z-10">
                <Button onClick={() => setEventFormOpen(true)} className="rounded-full cursor-pointer" variant="outline" size="lg"><Plus size={32} /></Button>
            </div>
        ) : (
            <div className="fixed bottom-12 right-15 z-10">
                <Button onClick={() => setEventFormOpen(false)} className="rounded-full cursor-pointer" variant="outline" size="lg"><X size={32} /></Button>
            </div>
        )
    )
}