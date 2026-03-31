"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Label } from "../ui/label";
import { Calendar, MapPin, Type, Image as ImageIcon, X, Edit3, Clock } from "lucide-react";
import { Field } from "../ui/field";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/authStore";
import * as LucideIcons from "lucide-react";
import React from "react";

export default function EventInformation() {
    const { isEventInfoOpen, selectedEvent, setEventInfoOpen, setEventFormOpen } = useUIStore();
    const user = useAuthStore(state => state.user);

    if (!isEventInfoOpen || !selectedEvent) return null;

    const isOwner = user && (selectedEvent.userId === user.sub || selectedEvent.userId === user.id);

    const handleEdit = () => {
        setEventInfoOpen(false);
        setEventFormOpen(true);
    };

    const IconComponent = (LucideIcons as any)[selectedEvent.icon] || LucideIcons.MapPin;

    return (
        <>
            <div className="absolute top-20 right-8 z-20 p-4">
                <Button
                    variant="outline"
                    onClick={() => setEventInfoOpen(false)}
                    className="w-10 h-10 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>
            <div className="absolute top-20 right-8 z-10">
                <Card className="max-w-md w-[380px] h-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-muted/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    {/* Header Image Area */}
                    <Field className="relative">
                        <div className="w-full h-40 bg-muted/40 flex flex-col items-center justify-center relative border-b">
                            {/* In a real app we'd show the event image here */}
                            <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent z-0" />
                            <div className="z-10 flex flex-col items-center">
                                <div className="p-4 bg-primary/10 rounded-2xl border-2 border-primary/20 mb-3 shadow-inner">
                                    <IconComponent className="w-12 h-12 text-primary" />
                                </div>
                                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Detalles del Evento</span>
                            </div>
                        </div>
                    </Field>

                    <CardHeader className="pb-3 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{selectedEvent.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-primary/80">
                                    <Clock className="w-3.5 h-3.5" /> Evento programado
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="overflow-y-auto pr-3 space-y-6 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                        <div className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label className="flex items-center gap-2 text-foreground/60 font-bold text-[10px] uppercase tracking-wider">
                                    <Type className="w-3.5 h-3.5 text-primary/70" /> Descripción
                                </Label>
                                <div className="bg-muted/30 p-3 rounded-xl border border-muted/50">
                                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                                        "{selectedEvent.description}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="flex items-center gap-2 text-foreground/60 font-bold text-[10px] uppercase tracking-wider">
                                        <MapPin className="w-3.5 h-3.5 text-primary/70" /> Ubicación
                                    </Label>
                                    <div className="flex items-center gap-2 bg-muted/20 px-3 py-2 rounded-lg border border-muted/30">
                                        <code className="text-[11px] font-mono text-muted-foreground">
                                            {Number(selectedEvent.lat).toFixed(6)}, {Number(selectedEvent.lng).toFixed(6)}
                                        </code>
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="flex items-center gap-2 text-foreground/60 font-bold text-[10px] uppercase tracking-wider">
                                        <Calendar className="w-3.5 h-3.5 text-primary/70" /> Fecha y hora
                                    </Label>
                                    <div className="flex items-center gap-3 bg-muted/20 px-3 py-2 rounded-lg border border-muted/30">
                                        <span className="text-sm font-medium">
                                            {new Date(selectedEvent.datetime).toLocaleString('es-ES', {
                                                dateStyle: 'long',
                                                timeStyle: 'short'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-4 pb-6 mt-auto border-t bg-muted/5 flex gap-3">
                        {isOwner && (
                            <Button
                                onClick={handleEdit}
                                className="flex-1 font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98] gap-2 py-6 rounded-xl"
                            >
                                <Edit3 className="w-4 h-4" /> Editar Evento
                            </Button>
                        )}
                        {!isOwner && (
                            <Button
                                onClick={() => setEventInfoOpen(false)}
                                className={`font-semibold transition-transform active:scale-[0.98] py-6 rounded-xl ${isOwner ? 'w-1/3' : 'flex-1'}`}
                            >
                                Asistir
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setEventInfoOpen(false)}
                            className={`font-semibold transition-transform active:scale-[0.98] py-6 rounded-xl ${isOwner ? 'w-1/3' : 'flex-1'}`}
                        >
                            Cerrar
                        </Button>

                    </CardFooter>
                </Card>
            </div>
        </>
    );
}