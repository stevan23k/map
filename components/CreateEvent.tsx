import { Plus } from "lucide-react";
import { Button } from "./ui/button";

export default function CreateEvent() {
    return (
        <div className="fixed bottom-12 right-15 z-10">
            <Button className="rounded-full cursor-pointer" variant="outline" size="lg"><Plus size={32} /></Button>
        </div>
    )
}