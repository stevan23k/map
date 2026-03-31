import { useState, ChangeEvent, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar, MapPin, Type, Image as ImageIcon, Map, Star, Bell, Flag, Heart, Shield, Zap, X, RotateCcw, Trash } from "lucide-react";
import { Field, FieldLabel } from "../ui/field";
import { useUIStore } from "@/store/ui";
import { useSocketStore } from "@/store/socketStore";
import { useRouteStore } from "@/store/routeStore";

export default function FormEvents() {
    const { isEventFormOpen, selectedLocation, setEventFormOpen, resetEventForm, selectedEvent, setSelectedLocation } = useUIStore();
    const isRoutingMode = useRouteStore((state) => state.isRoutingMode);
    const emitCreateEvent = useSocketStore(state => state.emitCreateEvent);
    const [selectedIcon, setSelectedIcon] = useState<string>("Map");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states for manual reset
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [datetime, setDatetime] = useState("");

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleClearImage = (e: React.MouseEvent) => {
        e.preventDefault();
        setImagePreview(null);
        const input = document.getElementById('picture') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleReset = () => {
        setTitle("");
        setDescription("");
        setDatetime("");
        setImagePreview(null);
        setSelectedIcon("Map");
        setErrors({});
        const input = document.getElementById('picture') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!selectedLocation) {
            setErrors({ location: "Por favor, selecciona una ubicación en el mapa" });
            return;
        }

        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = "El título es requerido";
        if (!description.trim()) newErrors.description = "La descripción es requerida";
        if (!datetime) newErrors.datetime = "La fecha y hora son requeridas";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await emitCreateEvent({
                title,
                description,
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                datetime,
                icon: selectedIcon
            });

            if (response.success) {
                // Close form and reset
                setEventFormOpen(false);
                handleReset();
            } else {
                setErrors({ server: response.message });
            }
        } catch (error) {
            setErrors({ server: "Error al crear el evento. Inténtalo de nuevo." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sync form with selected event for editing
    useEffect(() => {
        if (selectedEvent && isEventFormOpen) {
            setTitle(selectedEvent.title);
            setDescription(selectedEvent.description);
            setDatetime(selectedEvent.datetime);
            setSelectedIcon(selectedEvent.icon);
            setSelectedLocation({ lat: parseFloat(String(selectedEvent.lat)), lng: parseFloat(String(selectedEvent.lng)) });
        } else if (!selectedEvent && isEventFormOpen) {
            // Creating a new event — reset all text fields but keep selectedLocation
            setTitle("");
            setDescription("");
            setDatetime("");
            setSelectedIcon("Map");
            setErrors({});
        }
    }, [selectedEvent, isEventFormOpen, setSelectedLocation]);

    // Cleanup when closing
    useEffect(() => {
        if (!isEventFormOpen) {
            // handleReset(); // This might be too aggressive if we're just toggling
        }
    }, [isEventFormOpen]);

    // Hide when in routing mode
    if (isRoutingMode) return null;
    if (!isEventFormOpen) return null;

    const locationValue = selectedLocation
        ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
        : "";

    const icons = [
        { name: "Map", component: Map },
        { name: "Star", component: Star },
        { name: "Bell", component: Bell },
        { name: "Flag", component: Flag },
        { name: "Heart", component: Heart },
        { name: "Shield", component: Shield },
        { name: "Zap", component: Zap },
    ];

    return (
        <>
            <div className="absolute top-20 right-8 z-20 p-4">
                <Button
                    variant="outline"
                    onClick={() => setEventFormOpen(false)}
                    className=" w-10 h-10 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>
            <div className="absolute top-20 right-8 z-10">

                <Card size="default" className="max-w-md w-[380px] h-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-muted/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    {/* Header Image Area */}
                    <Field className="relative">
                        <label htmlFor="picture" className="w-full h-36 bg-muted/40 flex flex-col items-center justify-center relative group cursor-pointer border-b hover:bg-muted/60 transition-colors">
                            <Input id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover" />
                                    <Button
                                        variant="destructive"
                                        onClick={handleClearImage}
                                        className="absolute top-2 left-2 p-1.5 rounded-full"
                                        title="Remove image"
                                    >
                                        <Trash className="w-4 h-4" size={16} />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-2 group-hover:scale-110 transition-transform duration-300" />
                                    <span className="text-xs text-muted-foreground font-medium">Pulsa para subir una imagen</span>
                                </>
                            )}
                        </label>
                    </Field>

                    <CardHeader className="pb-3 relative">

                        <CardTitle className="text-xl font-bold tracking-tight">
                            {selectedEvent ? 'Editar evento' : 'Crear evento'}
                        </CardTitle>
                        <CardDescription>
                            {selectedEvent 
                                ? 'Modifica los campos necesarios para actualizar el evento.' 
                                : 'Completa los campos para añadir un nuevo evento al mapa.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="overflow-y-auto pr-3 space-y-4 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                        <form className="flex flex-col gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="title" className="flex items-center gap-1.5 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                                    <Type className="w-3.5 h-3.5 text-primary" /> Titulo
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="E.g. Summer Music Festival"
                                    required
                                    className={`h-9 ${errors.title ? 'border-destructive' : ''}`}
                                />
                                {errors.title && <p className="text-[10px] font-medium text-destructive mt-0.5">{errors.title}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="description" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Descripción</Label>
                                <textarea
                                    id="description"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${errors.description ? 'border-destructive' : ''}`}
                                    placeholder="Detalles sobre lo que sucederá..."
                                />
                                {errors.description && <p className="text-[10px] font-medium text-destructive mt-0.5">{errors.description}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="place" className="flex items-center gap-1.5 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                                    <MapPin className="w-3.5 h-3.5 text-primary" /> Lugar / Ubicación
                                </Label>
                                <Input
                                    id="place"
                                    value={locationValue}
                                    readOnly
                                    placeholder="Selecciona una ubicación en el mapa"
                                    required
                                    className={`h-9 bg-muted/30 cursor-not-allowed ${errors.location ? 'border-destructive' : ''}`}
                                />
                                {errors.location && <p className="text-[10px] font-medium text-destructive mt-0.5">{errors.location}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="datetime" className="flex items-center gap-1.5 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha y hora
                                </Label>
                                <Input
                                    id="datetime"
                                    type="datetime-local"
                                    value={datetime}
                                    onChange={(e) => setDatetime(e.target.value)}
                                    required
                                    className={`h-9 block w-full ${errors.datetime ? 'border-destructive' : ''}`}
                                />
                                {errors.datetime && <p className="text-[10px] font-medium text-destructive mt-0.5">{errors.datetime}</p>}
                            </div>

                            <div className="grid gap-1.5 pb-2">
                                <Label className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Map Icon</Label>
                                <div className="flex gap-2 flex-wrap mt-1">
                                    {icons.map((icon) => {
                                        const IconComponent = icon.component;
                                        const isSelected = selectedIcon === icon.name;

                                        return (
                                            <button
                                                key={icon.name}
                                                type="button"
                                                onClick={() => setSelectedIcon(icon.name)}
                                                title={icon.name}
                                                className={`p-2 rounded-xl border-2 transition-all duration-200 flex items-center justify-center
                                                ${isSelected
                                                        ? 'border-primary bg-primary/10 text-primary scale-110 shadow-sm'
                                                        : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                    </CardContent>

                    <CardFooter className="pt-4 mt-auto border-t flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            className="flex-1 font-semibold transition-transform active:scale-[0.98] gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> Restablecer
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            type="button"
                            disabled={isSubmitting}
                            className="flex-2 font-semibold shadow-sm transition-transform active:scale-[0.98] relative"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                                    {selectedEvent ? 'Actualizando...' : 'Creando...'}
                                </span>
                            ) : (
                                selectedEvent ? "Actualizar evento" : "Crear evento"
                            )}
                        </Button>
                    </CardFooter>
                    {errors.server && (
                        <div className="px-6 pb-4">
                            <p className="text-xs font-medium text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                                {errors.server}
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </>
    )
}