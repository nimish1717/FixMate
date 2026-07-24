import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../store/notificationStore";
import { useToastStore } from "../../store/toastStore";
import { bookingService } from "../../services/bookingService";
import { useState, useEffect } from "react";
import {
    Home,
    Calendar,
    MessageSquare,
    MapPin,
    Bell,
    Star,
    User,
    Settings,
    Wrench,
} from "lucide-react";

const getMainNav = (role) => {
    if (role === "admin") {
        return [
            { to: "/admin", label: "Dashboard", icon: Home },
        ];
    }
    if (role === "shopkeeper") {
        return [
            { to: "/shopkeeper", label: "Dashboard", icon: Home },
            { to: "/shopkeeper/workers/new", label: "Register Worker", icon: User },
        ];
    }
    if (role === "worker") {
        return [
            { to: "/worker", label: "Dashboard", icon: Home },
            { to: "/worker/history", label: "My Jobs", icon: Calendar },
            { to: "/chat", label: "Chat", icon: MessageSquare },
        ];
    }
    // user
    return [
        { to: "/home", label: "Home", icon: Home },
        { to: "/bookings", label: "Bookings", icon: Calendar },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/tracking", label: "Live Tracking", icon: MapPin },
    ];
};

const getAccountNav = (role) => {
    if (role === "admin") {
        return [
            { to: "/profile", label: "Profile", icon: User },
            { to: "/settings", label: "Settings", icon: Settings },
        ];
    }
    if (role === "worker") {
        return [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/reviews", label: "Reviews", icon: Star },
            { to: "/profile", label: "Profile", icon: User }
        ];
    }
    // user / shopkeeper
    return [
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/profile", label: "Profile", icon: User }
    ];
};

function NavItem({ to, label, icon: Icon, badge, onClick }) {
    // Exact match for base dashboard routes so they don't stay highlighted on sub-pages
    const isExact = ["/home", "/worker", "/shopkeeper", "/admin"].includes(to);

    return (
        <NavLink
            to={to}
            end={isExact}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${isActive
                    ? "bg-[#0f172a] text-white"
                    : "text-gray-500 hover:bg-[#f8f7ff]"
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={17}
                        className={isActive ? "text-blue-300" : "text-gray-400"}
                    />
                    <span>{label}</span>
                    {badge && (
                        <span
                            className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white text-[#0f172a]" : "bg-[#0f172a] text-white"
                                }`}
                        >
                            {badge}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const showToast = useToastStore((state) => state.showToast);

    const [activeBooking, setActiveBooking] = useState(null);
    useEffect(() => {
        if (user?.role === "user" || !user?.role) {
            bookingService.getActive().then(res => {
                if (res.booking) setActiveBooking(res.booking);
            }).catch(() => { });
        }
    }, [isOpen, user?.role]);
    const userName = user?.name || "Guest";
    const userRole = user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : "Customer";
    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-[#1e1b4b]/20 z-40 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-[230px] bg-white border-r border-[#ede9fe] flex flex-col h-full flex-shrink-0
                transform transition-transform duration-200 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0
            `}>
                {/* Brand */}
                <div className="px-5 py-4 border-b border-[#ede9fe] flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                        <Wrench size={18} className="text-white" />
                    </div>
                    <span className="text-[17px] font-bold text-[#1e1b4b]">FixKar</span>
                </div>

                {/* Nav */}
                <nav className="px-3 py-3.5 flex-1 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider px-2 mt-3 mb-1.5">
                        Main
                    </p>
                    {getMainNav(user?.role).map((item) => {
                        const isChat = item.to === "/chat";
                        const isTracking = item.to === "/tracking";

                        const handleClick = (e) => {
                            if (isChat) {
                                e.preventDefault();
                                if (activeBooking) {
                                    navigate(`/chat/${activeBooking._id}`);
                                } else {
                                    if (user?.role === "worker") {
                                        navigate("/worker/history");
                                    } else {
                                        navigate("/bookings"); // Can add ?filter=unread later
                                    }
                                }
                                if (onClose) onClose();
                            } else if (isTracking) {
                                e.preventDefault();
                                if (activeBooking) {
                                    navigate(`/bookings/${activeBooking._id}`);
                                } else {
                                    showToast("No active booking to track right now", "error");
                                }
                                if (onClose) onClose();
                            } else {
                                if (onClose) onClose();
                            }
                        };

                        return (
                            <NavItem
                                key={item.to}
                                {...item}
                                onClick={isChat || isTracking ? handleClick : undefined}
                            />
                        );
                    })}

                    <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider px-2 mt-3 mb-1.5">
                        Account
                    </p>
                    {getAccountNav(user?.role).map((item) => (
                        <NavItem
                            key={item.to}
                            {...item}
                            badge={item.to === "/notifications" && unreadCount > 0 ? unreadCount : undefined}
                            onClick={() => { if (onClose) onClose() }}
                        />
                    ))}
                </nav>

                {/* User chip */}
                <div className="p-3.5 border-t border-[#ede9fe]">
                    <div
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f8f7ff] rounded-xl cursor-pointer transition-colors hover:bg-gray-100"
                    >
                        <div className="w-[34px] h-[34px] rounded-[10px] bg-blue-100 flex items-center justify-center text-xs font-bold text-[#0f172a] flex-shrink-0">
                            {initials}
                        </div>
                        <div>
                            <div className="text-[13px] font-semibold text-[#1e1b4b]">{userName}</div>
                            <div className="text-[11px] text-gray-500">{userRole}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}