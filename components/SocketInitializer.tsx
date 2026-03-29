"use client";

import { useEffect } from "react";
import { useAuthStore, getCookie } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";

export function SocketInitializer({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const connect = useSocketStore((state) => state.connect);
    const disconnect = useSocketStore((state) => state.disconnect);

    useEffect(() => {
        const token = getCookie("access_token");

        // Connect regardless of user status, passing token if available
        connect(token || undefined);

        return () => {
            // Optional: disconnect on unmount if needed
            // disconnect();
        };
    }, [user, connect]);

    return <>{children}</>;
}
