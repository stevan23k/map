"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isLoading, login } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && user) {
      router.push("/profile");
    }
  }, [mounted, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login({ identifier, password });
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || (isLoading || user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-6 left-6 gap-2 text-zinc-500"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>
      <Card className="w-full max-w-sm shrink-0 shadow-sm border-zinc-200 dark:border-zinc-800 mt-12 sm:mt-0">
        <CardHeader className="space-y-1 items-center pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">Acceso</CardTitle>
          <CardDescription className="text-center text-sm">
            Ingresa tu email o usuario para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="identifier">Identificador</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="tu@email.com o username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? "Cargando..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/50 pt-6">
          <p className="text-sm text-zinc-500 text-center">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline underline-offset-4 pointer-events-auto">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
