"use client"
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocketStore } from "@/store/socketStore";
import GlobalSearchBar from "./GlobalSearchBar";

export default function MapHeader() {
    const router = useRouter();
    const { isConnected } = useSocketStore();

    return (
        <header className="w-full fixed top-0 z-10 flex justify-center px-6">
            <div className="flex flex-row items-center justify-between w-full max-w-7xl pt-10">

                <div className="text-2xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-default">
                    <GlobalSearchBar />
                </div>

                {/* Status + Avatar — text first, avatar rightmost */}
                <div className="flex items-center gap-3 justify-end">
                    {/* Connection status */}
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                        <span className={`text-sm font-semibold whitespace-nowrap ${isConnected ? "text-green-500" : "text-red-500"}`}>
                            {isConnected ? "Conectado" : "Desconectado"}
                        </span>
                    </div>
                    {/* Avatar — always rightmost, never pushed */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 rounded-full cursor-pointer h-10 w-10"
                        onClick={() => router.push("/profile")}
                    >
                        <User size={32} />
                    </Button>
                </div>
            </div>
        </header >
    )
}