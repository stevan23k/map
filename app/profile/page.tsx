"use client"

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, MapPin, ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Profile() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    return (
        <>
            <header className="w-full flex justify-center px-6">
                <div className="flex items-center justify-between w-full max-w-5xl pt-10">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={() => router.push("/")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al Inicio
                        </Button>
                    </div>
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            onClick={() => {
                                useAuthStore.getState().logout();
                                router.push("/");
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-24 flex flex-col items-center relative">

                <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Bienvenido, {user?.firstName || user?.username}
                        </h1>
                        <p className="text-zinc-500 text-lg">
                            Estás listo para explorar el mundo. Dirígete al mapa interactivo para comenzar a trabajar.
                        </p>
                    </div>

                    <div className="pt-4 max-w-sm mx-auto">
                        <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-transparent">
                            <CardHeader>
                                <CardTitle className="text-lg">Tus datos</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 text-sm">
                                <div className="flex justify-between border-b pb-2 border-zinc-100 dark:border-zinc-800/50">
                                    <span className="text-zinc-500">Usuario</span>
                                    <span className="font-medium text-right">{user?.username}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 border-zinc-100 dark:border-zinc-800/50">
                                    <span className="text-zinc-500">Email</span>
                                    <span className="font-medium text-right">{user?.email}</span>
                                </div>
                                <div className="flex justify-between pb-2">
                                    <span className="text-zinc-500">Nombre completo</span>
                                    <span className="font-medium text-right">{user?.firstName} {user?.lastName}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    )
}
