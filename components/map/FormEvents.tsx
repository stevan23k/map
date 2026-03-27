import { useState, ChangeEvent } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar, MapPin, Type, Image as ImageIcon, Map, Star, Bell, Flag, Heart, Shield, Zap, X } from "lucide-react";
import { Field, FieldLabel } from "../ui/field";

export default function FormEvents() {
    const [selectedIcon, setSelectedIcon] = useState<string>("Map");
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleClearImage = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent triggering the label click
        setImagePreview(null);
        // Also clear the file input
        const input = document.getElementById('picture') as HTMLInputElement;
        if (input) input.value = '';
    };

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
        <div className="absolute top-20 right-8 z-10">
            <Card size="default" className="max-w-md w-[380px] h-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-muted/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                {/* Header Image Area */}
                <Field className="relative">
                    <label htmlFor="picture" className="w-full h-36 bg-muted/40 flex flex-col items-center justify-center relative group cursor-pointer border-b hover:bg-muted/60 transition-colors">
                        <Input id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={handleClearImage}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                                    title="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-2 group-hover:scale-110 transition-transform duration-300" />
                                <span className="text-xs text-muted-foreground font-medium">Pulsa para subir una imagen</span>
                            </>
                        )}
                    </label>
                </Field>

                <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold tracking-tight">Crear evento</CardTitle>
                    <CardDescription>
                        Completa los campos para añadir un nuevo evento al mapa.
                    </CardDescription>
                </CardHeader>

                <CardContent className="overflow-y-auto pr-3 space-y-4 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <form className="flex flex-col gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="title" className="flex items-center gap-1.5 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                                <Type className="w-3.5 h-3.5 text-primary" /> Titulo
                            </Label>
                            <Input id="title" placeholder="E.g. Summer Music Festival" required className="h-9" />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Descripción</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                placeholder="Detalles sobre lo que sucederá..."
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="place" className="flex items-center gap-1.5 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                                <MapPin className="w-3.5 h-3.5 text-primary" /> Lugar / Ubicación
                            </Label>
                            <Input id="place" placeholder="E.g. Central Park, NY" required className="h-9" />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="datetime" className="flex items-center gap-1.5 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha y hora
                            </Label>
                            <Input id="datetime" type="datetime-local" required className="h-9 block w-full" />
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

                <CardFooter className="pt-4 mt-auto border-t">
                    <Button type="submit" className="w-full font-semibold shadow-sm transition-transform active:scale-[0.98]">
                        Crear evento
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}