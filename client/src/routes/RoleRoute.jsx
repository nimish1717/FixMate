import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Restricts a route to specific roles. Use alongside ProtectedRoute:
//   <Route element={<ProtectedRoute />}>
//     <Route element={<RoleRoute allow={["worker"]} />}>
//       <Route path="/worker" element={<WorkerDashboard />} />
//     </Route>
//   </Route>
//
// If role doesn't match, redirect to that role's home instead of
// showing a blank/broken page.
export default function RoleRoute({ allow }) {
    const user = useAuthStore((state) => state.user);
    const role = user?.role || "user";

    if (!allow.includes(role)) {
        const fallback =
            role === "worker" ? "/worker" :
                role === "shopkeeper" ? "/shopkeeper" :
                    role === "admin" ? "/admin" : "/";
        return <Navigate to={fallback} replace />;
    }

    return <Outlet />;
}