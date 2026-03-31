import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system", // Valor por defecto
      setTheme: (theme) => {
        set({ theme });
        // Sincronizar inmediatamente con Tailwind
        if (typeof window !== "undefined") {
          const isDark =
            theme === "dark" ||
            (theme === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);
          
          if (isDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }),
    {
      name: "theme-storage",
    }
  )
);
