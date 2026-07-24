import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Landing from "../pages/landing/Landing";

export default function RootRoute() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const hydrating = useAuthStore((state) => state.hydrating);

    if (hydrating) return null;

    if (!token) {
        return <Landing />;
    }

    const role = user?.role || "user";
    const destinations = {
        user: "/home",
        worker: "/worker",
        shopkeeper: "/shopkeeper",
        admin: "/admin",
    };

    return <Navigate to={destinations[role] || "/home"} replace />;
}
