import axios from "axios";

// Single axios instance. Base URL comes from .env so it's different
// for local dev vs production — never hardcoded elsewhere.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});
/*
    intercepts every single API request 
    right before it leaves your React app. 
*/

// Attach JWT token to every request automatically, if present.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("fixkar_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// If backend ever returns 401 (token expired/invalid), clear token
// and redirect to login. Centralized here — no page needs to handle this.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("fixkar_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;