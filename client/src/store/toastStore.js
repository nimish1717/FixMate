import { create } from "zustand";

let nextId = 1;

// Global toast store. Call toast.success / toast.error / toast.info anywhere —
// no prop drilling, no context needed.
export const useToastStore = create((set, get) => ({
    toasts: [],

    addToast: (message, type = "info", duration = 3500) => {
        const id = nextId++;
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, duration);
    },

    showToast: (message, type = "info", duration = 3500) => get().addToast(message, type, duration),

    removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helper — import this and call toast.success("Done!") anywhere
export const toast = {
    success: (message, duration) =>
        useToastStore.getState().addToast(message, "success", duration),
    error: (message, duration) =>
        useToastStore.getState().addToast(message, "error", duration),
    info: (message, duration) =>
        useToastStore.getState().addToast(message, "info", duration),
    warning: (message, duration) =>
        useToastStore.getState().addToast(message, "warning", duration),
};
