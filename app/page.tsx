"use client"
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Map, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/map");
    }
  })


  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans">
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <MapPin className="w-5 h-5" />
            <span>MapApp</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push("/profile")}>
                  Mi Perfil
                </Button>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Iniciar sesión
                </Link>
                <Button size="sm" className="rounded-full">
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-24 flex flex-col items-center">
        <div className="text-center max-w-3xl mx-auto space-y-8 mt-12 md:mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-sm font-medium">
            ✨ La nueva forma de explorar
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">
            Explora y descubre <br className="hidden sm:block" />
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
            Crea eventos y descubre eventos increibles donde puedes compartir en tu ciudad con tus amigos
          </p>
          <div>
            <Button type="button" variant="outline" className="rounded-full cursor-pointer h-12 w-40 px-4 py-2 text-lg" onClick={() => router.push("/map")}>Ir al mapa</Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full w-full sm:w-auto">
              <Link href="/register">Comenzar gratis</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto bg-transparent">
              <Link href="/login">Acceder a mi cuenta</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
