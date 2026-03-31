"use client"

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, MapPin, ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSocketStore, Event } from "@/store/socketStore";
import { useRouteStore } from "@/store/routeStore";
import * as LucideIcons from "lucide-react";
import { Calendar } from "lucide-react";

export default function Profile() {
    const { user } = useAuthStore();
    const { events } = useSocketStore();
    const setPendingFlyTo = useRouteStore(state => state.setPendingFlyTo);
    const router = useRouter();
    const [filter, setFilter] = useState<'created' | 'attending'>('created');

    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    const userId = user?.id || user?.sub || "";
    const createdEvents = events.filter(e => e.userId === userId);
    const attendingEvents = events.filter(e => e.attendees?.some(u => u.id === userId));
    
    const displayEvents = filter === 'created' ? createdEvents : attendingEvents;

    const handleViewOnMap = (event: Event) => {
        setPendingFlyTo([event.lng, event.lat], 16);
        router.push("/map");
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            <header className="w-full flex justify-center px-4 sm:px-6">
                <div className="flex items-center justify-between w-full max-w-5xl pt-4 sm:pt-10">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 sm:px-4"
                            onClick={() => router.push("/")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Volver al Inicio</span>
                        </Button>
                    </div>
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors px-2 sm:px-4"
                            onClick={() => {
                                useAuthStore.getState().logout();
                                router.push("/");
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Cerrar sesión</span>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 flex flex-col items-center gap-6 sm:gap-12">

                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Hola, {user?.firstName || user?.username}
                        </h1>
                        <p className="text-zinc-500 text-base sm:text-lg max-w-lg mx-auto px-4">
                            Gestiona tus eventos y revisa a cuáles te has unido desde aquí.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Profile Info Card */}
                        <div className="md:col-span-1">
                            <Card className="shadow-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 sticky top-10">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        Tus datos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Usuario</p>
                                        <p className="font-medium">{user?.username}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Email</p>
                                        <p className="font-medium">{user?.email}</p>
                                    </div>
                                    <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <Button 
                                            className="w-full gap-2 shadow-sm"
                                            onClick={() => router.push("/map")}
                                        >
                                            <Map className="w-4 h-4" />
                                            Ir al Mapa
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Events List section */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl w-full sm:w-fit overflow-x-auto">
                                <Button
                                    variant={filter === 'created' ? 'default' : 'ghost'}
                                    className={`flex-1 sm:flex-none rounded-lg px-3 sm:px-6 transition-all text-xs sm:text-sm ${filter === 'created' ? 'shadow-sm' : 'text-zinc-500'}`}
                                    onClick={() => setFilter('created')}
                                >
                                    Mis Eventos ({createdEvents.length})
                                </Button>
                                <Button
                                    variant={filter === 'attending' ? 'default' : 'ghost'}
                                    className={`flex-1 sm:flex-none rounded-lg px-3 sm:px-6 transition-all text-xs sm:text-sm ${filter === 'attending' ? 'shadow-sm' : 'text-zinc-500'}`}
                                    onClick={() => setFilter('attending')}
                                >
                                    Asistiendo ({attendingEvents.length})
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {displayEvents.length > 0 ? (
                                    displayEvents.map((event) => {
                                        const Icon = (LucideIcons as any)[event.icon] || MapPin;
                                        return (
                                            <Card key={event.id} className="group hover:border-primary/50 transition-colors shadow-xs hover:shadow-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-primary/10 transition-colors">
                                                            <Icon className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{event.title}</h3>
                                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(event.datetime).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => handleViewOnMap(event)}
                                                        className="rounded-lg shadow-xs hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                                    >
                                                        Ver en mapa
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center gap-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                                        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full">
                                            <Map className="w-8 h-8 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 font-medium">No hay eventos para mostrar</p>
                                            <Button variant="link" onClick={() => router.push("/map")} className="text-primary mt-1">Explorar el mapa</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
