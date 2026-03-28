import { create } from "zustand";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface Event {
    id: string;
    title: string;
    description: string;
    lat: number;
    lng: number;
    datetime: string;
    icon: string;
    userId: string;
}

interface UserLocation {
    userId: string;
    lat: number;
    lng: number;
    username: string;
}

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    events: Event[];
    otherUsers: Record<string, UserLocation>;

    // Actions
    connect: (token: string) => void;
    disconnect: () => void;
    emitCreateEvent: (eventData: Omit<Event, "id" | "userId">) => void;
    emitUpdateLocation: (location: { lat: number; lng: number }) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    events: [],
    otherUsers: {},

    connect: (token: string) => {
        const currentSocket = get().socket;
        if (currentSocket) return;

        const socket = io(API_URL, {
            auth: {
                token: `Bearer ${token}`,
            },
        });

        socket.on("connect", () => {
            set({ isConnected: true });
            console.log("Socket connected:", socket.id);
        });

        socket.on("disconnect", () => {
            set({ isConnected: false });
            console.log("Socket disconnected");
        });

        // Listen for new events from others
        socket.on("event_created", (newEvent: Event) => {
            set((state) => ({
                events: [newEvent, ...state.events],
            }));
        });

        // Listen for other users moving
        socket.on("user_location_updated", (userData: UserLocation) => {
            set((state) => ({
                otherUsers: {
                    ...state.otherUsers,
                    [userData.userId]: userData,
                },
            }));
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    emitCreateEvent: (eventData) => {
        const { socket } = get();
        if (socket) {
            socket.emit("create_event", eventData);
        }
    },

    emitUpdateLocation: (location) => {
        const { socket } = get();
        if (socket) {
            socket.emit("update_location", location);
        }
    },
}));
