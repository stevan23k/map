import { create } from "zustand";
import { io, Socket } from "socket.io-client";

const API_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;

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

interface Response {
  success: boolean;
  message: string;
}
interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  events: Event[];
  otherUsers: Record<string, UserLocation>;

  // Actions
  connect: (token?: string) => void;
  disconnect: () => void;
  emitCreateEvent: (eventData: Omit<Event, "id" | "userId">) => Promise<Response>;
  emitUpdateLocation: (location: { lat: number; lng: number }) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  events: [],
  otherUsers: {},

  connect: (token?: string) => {
    const currentSocket = get().socket;

    // If already connected, we might need to reconnect if the token is new
    if (currentSocket) {
      if (token) {
        console.log("Reconnecting with new token...");
        currentSocket.disconnect();
      } else {
        return; // Already connected as guest or with token
      }
    }

    console.log("Connecting to socket at:", API_URL, token ? "with token" : "as guest");

    const socketOptions: any = {};
    if (token) {
      socketOptions.auth = {
        token: `Bearer ${token}`,
      };
    }

    const socket = io(API_URL, socketOptions);

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
      console.log("New event received via socket:", newEvent);
      set((state) => ({
        events: [newEvent, ...state.events],
      }));
    });

    // Listen for all events (initial or periodic refresh)
    socket.on("all_events", (allEvents: Event[]) => {
      console.log("All events received via socket:", allEvents);
      set({ events: allEvents });
    });

    // Listen for other users moving
    socket.on("user_location_updated", (userData: UserLocation) => {
      console.log("User location updated via socket:", userData);
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
    if (!socket) {
      return Promise.resolve({ success: false, message: "No hay conexión con el servidor" });
    }

    return new Promise((resolve) => {
      // Configurar timeout por si el servidor no responde
      const timeout = setTimeout(() => {
        resolve({ success: false, message: "Tiempo de espera agotado" });
      }, 5000);

      socket.emit("create_event", eventData, (response: Response) => {
        clearTimeout(timeout);
        resolve(response || { success: true, message: "Evento creado con éxito" });
      });
    });
  },

  emitUpdateLocation: (location) => {
    const { socket } = get();
    if (socket) {
      socket.emit("update_location", location);
    }
  },
}));
