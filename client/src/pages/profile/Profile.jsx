import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, LogOut, ChevronRight, Clock } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { useAuthStore } from "../../store/authStore";
import ComingSoonModal from "../../components/ui/ComingSoonModal";
import { workerService } from "../../services/workerService";
import { useToastStore } from "../../store/toastStore";

// Menu items below profile card. Each either navigates or shows
// a "coming soon" modal — add new items here only.
const MENU_ITEMS = [
    { label: "My Bookings", to: "/bookings" },
    { label: "Saved Addresses", comingSoon: true },
    { label: "Payment Methods", comingSoon: true },
    { label: "Warranty Claims", comingSoon: true },
    { label: "Help & Support", comingSoon: true },
];

export default function Profile() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const showToast = useToastStore((state) => state.showToast);

    const [showComingSoon, setShowComingSoon] = useState(false);
    const [comingSoonLabel, setComingSoonLabel] = useState("");
    
    // Auto-Offline Modal State
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [currentTimeout, setCurrentTimeout] = useState(0);
    const [isSavingTimeout, setIsSavingTimeout] = useState(false);

    const name = user?.name || "User";
    const phone = user?.phone || "—";
    const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    // Dynamic menu combining common and role-specific
    const profileMenuItems = [...MENU_ITEMS];
    if (user?.role === "worker") {
        profileMenuItems.push({ label: "Auto-Offline Settings", isTimeoutSetting: true });
    }

    // Fetch initial timeout for workers
    useEffect(() => {
        if (user?.role === "worker") {
            workerService.getProfile()
                .then(res => setCurrentTimeout(res.worker?.autoOfflineTimeout || 0))
                .catch(() => {});
        }
    }, [user?.role]);

    const handleMenuClick = (item) => {
        if (item.comingSoon) {
            setComingSoonLabel(item.label);
            setShowComingSoon(true);
            return;
        }
        if (item.isTimeoutSetting) {
            setShowTimeoutModal(true);
            return;
        }
        navigate(item.to);
    };

    const handleLogout = () => {
        const role = user?.role; // capture before logout() nulls the user
        logout();
        navigate(role === "admin" ? "/admin/login" : "/login");
    };

    const handleSaveTimeout = async (val) => {
        setIsSavingTimeout(true);
        try {
            await workerService.updateOfflineTimeout(val);
            setCurrentTimeout(val);
            setShowTimeoutModal(false);
            showToast("Auto-offline settings updated!", "success");
        } catch (error) {
            showToast("Failed to update settings", "error");
        } finally {
            setIsSavingTimeout(false);
        }
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-[#1e1b4b]">Profile</h1>
            </div>

            <div className="max-w-[480px] mx-auto mt-6 flex flex-col gap-4">

                {/* Profile card */}
                <div className="bg-[#0f172a] rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white mb-1">{name}</h2>
                        <p className="text-xs text-blue-200 flex items-center gap-1.5">
                            <Phone size={12} />
                            +91 {phone}
                        </p>
                    </div>
                </div>

                {/* Menu */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
                    {profileMenuItems.map((item, i) => (
                        <button
                            key={item.label}
                            onClick={() => handleMenuClick(item)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-[#1e1b4b] ${i !== profileMenuItems.length - 1 ? "border-b border-[#ede9fe]" : ""
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {item.isTimeoutSetting && <Clock size={16} className="text-indigo-400" />}
                                {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                                {item.comingSoon && (
                                    <span className="text-[10px] bg-[#f8f7ff] text-gray-400 px-2 py-0.5 rounded-full">
                                        Soon
                                    </span>
                                )}
                                {item.isTimeoutSetting && (
                                    <span className="text-xs text-gray-500">
                                        {currentTimeout === 0 ? "Manual Only" : `${currentTimeout} mins`}
                                    </span>
                                )}
                                <ChevronRight size={16} className="text-gray-300" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-white border border-red-100 text-red-500 text-sm font-semibold rounded-2xl py-3.5 flex items-center justify-center gap-2"
                >
                    <LogOut size={16} />
                    Log out
                </button>
            </div>

            <ComingSoonModal
                open={showComingSoon}
                onClose={() => setShowComingSoon(false)}
                icon={<MapPin size={28} className="text-blue-500" />}
                title={comingSoonLabel}
                message={`${comingSoonLabel} will be integrated in a future update.`}
            />

            {/* Auto-Offline Settings Modal */}
            {showTimeoutModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 pb-0 sm:pb-4 transition-opacity">
                    <div className="bg-white w-full max-w-[400px] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 text-center border-b border-[#ede9fe]">
                            <h3 className="text-lg font-bold text-[#1e1b4b]">Auto-Offline Settings</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                Choose how long you should remain online if you close the app or lose connection.
                            </p>
                        </div>
                        <div className="p-4 space-y-2">
                            {[
                                { label: "Manual Only (Never auto-offline)", value: 0 },
                                { label: "15 Minutes", value: 15 },
                                { label: "30 Minutes", value: 30 },
                                { label: "1 Hour", value: 60 },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    disabled={isSavingTimeout}
                                    onClick={() => handleSaveTimeout(opt.value)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                                        currentTimeout === opt.value
                                            ? "border-indigo-500 bg-indigo-50 text-[#1e1b4b] font-semibold"
                                            : "border-[#ede9fe] hover:bg-[#f8f7ff] text-gray-700"
                                    }`}
                                >
                                    {opt.label}
                                    {currentTimeout === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50">
                            <button
                                onClick={() => setShowTimeoutModal(false)}
                                disabled={isSavingTimeout}
                                className="w-full py-3 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}