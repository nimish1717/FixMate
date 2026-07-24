import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Wraps protected routes. If no token exists, redirect to /login.
// Usage in AppRouter: <Route element={<ProtectedRoute />}> ... </Route>
export default function ProtectedRoute() {
    const token = useAuthStore((state) => state.token);
    const hydrating = useAuthStore((state) => state.hydrating);

    // Wait for /auth/me to finish on hard refresh before deciding
    if (hydrating) return null;

    if (!token) {
        return <Navigate to="/" replace />;
    }

    /* 
        "Okay, they are allowed in. Go ahead and render whatever 
        child page they were originally trying to access."
    */
    return <Outlet />;
}