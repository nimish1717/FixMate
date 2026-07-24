import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

// Single shared socket connection. Components use this hook to get
// the socket instance and to join/leave booking rooms.
//
// Usage:
//   const socket = useSocket();
//   useEffect(() => {
//     socket.emit("booking:join", bookingId);
//     socket.on("booking:statusChanged", handler);
//     return () => {
//       socket.emit("booking:leave", bookingId);
//       socket.off("booking:statusChanged", handler);
//     };
//   }, [bookingId]);

let socketInstance = null;

export function useSocket() {
    const token = useAuthStore((state) => state.token);
    const ref = useRef(null);

    if (!socketInstance && token) {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        socketInstance = io(socketUrl, {
            auth: { token },
            autoConnect: true,
        });
    }

    useEffect(() => {
        return () => {
            // Don't disconnect on every component unmount —
            // only when the app itself unmounts (rare). Socket stays
            // alive across page navigations for real-time updates.
        };
    }, []);

    ref.current = socketInstance;
    return ref.current;
}