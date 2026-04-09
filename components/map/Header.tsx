"use client"
import { Button } from "@/components/ui/button";
import { User, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocketStore } from "@/store/socketStore";
import { useThemeStore } from "@/store/themeStore";
import GlobalSearchBar from "./GlobalSearchBar";

export default function MapHeader() {
    const router = useRouter();
    const { isConnected } = useSocketStore();
    const theme = useThemeStore(state => state.theme);
    const setTheme = useThemeStore(state => state.setTheme);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <header className="w-full fixed top-0 z-20 flex justify-center px-4 sm:px-6">
            <div className="flex flex-row items-center justify-between w-full max-w-7xl pt-4 sm:pt-10 gap-2">

                <div className="text-2xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-default">
                    <GlobalSearchBar />
                </div>

                {/* Status + Theme + Avatar */}
                <div className="flex items-center gap-3 justify-end">
                    {/* Connection status */}
                    <div
                        className={`flex items-center gap-2 ${!isConnected ? "cursor-pointer hover:opacity-80 active:scale-95 transition-all" : ""}`}
                        onClick={() => {
                            if (!isConnected) {
                                const { socket, connect } = useSocketStore.getState();
                                if (socket) socket.connect();
                                else connect();
                            }
                        }}
                        title={!isConnected ? "Haz clic para reconectar" : "Conexión estable"}
                        data-intro="Verifica aquí si estás conectado en tiempo real para recibir actualizaciones."
                        data-step="4"
                    >
                        <div className={`h-3 w-3 rounded-full shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                        <span className={`text-sm font-semibold whitespace-nowrap ${isConnected ? "text-green-500" : "text-red-500"}`}>
                            {isConnected ? "Conectado" : "Desconectado"}
                        </span>
                    </div>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md shadow-sm border border-zinc-200 dark:border-zinc-700"
                        onClick={toggleTheme}
                    >
                        {theme === "dark" ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-500" />}
                    </Button>

                    {/* Avatar */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-full cursor-pointer h-10 w-10 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md shadow-sm border border-zinc-200 dark:border-zinc-700"
                        onClick={() => router.push("/profile")}
                        data-intro="Accede a tu perfil para gestionar tus eventos y configuración."
                        data-step="5"
                    >
                        <User size={20} className="text-zinc-700 dark:text-zinc-300" />
                    </Button>
                </div>
            </div>
        </header >
    )
}