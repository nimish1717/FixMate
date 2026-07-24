/*
    Zustand's create function initializes a global 
    "store" that any React component can access.
    set: A function used to update the state.
    get: A function used to read the current state.
*/

import { create } from "zustand";
import api from "../services/api";

export const useAuthStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem("fixkar_token") || null,
    // true while we're re-fetching the user on a hard refresh.
    // Guards RoleRoute from redirecting before the role is known.
    hydrating: !!localStorage.getItem("fixkar_token"),

    // Call once at app start. If a token exists, re-fetch /auth/me
    // so user.role is populated even after a hard refresh.
    hydrate: async () => {
        const token = get().token;
        if (!token) {
            set({ hydrating: false });
            return;
        }
        try {
            const res = await api.get("/auth/me");
            set({ user: res.data.user || res.data, hydrating: false });
        } catch {
            // Token invalid / expired — clear it and send to login
            localStorage.removeItem("fixkar_token");
            set({ user: null, token: null, hydrating: false });
        }
    },

    login: (user, token) => {
        localStorage.setItem("fixkar_token", token);
        set({ user, token, hydrating: false });
    },

    logout: () => {
        localStorage.removeItem("fixkar_token");
        set({ user: null, token: null, hydrating: false });
    },

    isAuthenticated: () => !!get().token,
}));