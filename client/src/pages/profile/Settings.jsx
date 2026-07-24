import { useState } from "react";
import { User, Bell, Lock, Shield, CreditCard, LogOut } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Settings() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("general");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <PageWrapper>
            <div className="max-w-4xl mx-auto mt-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#1e1b4b]">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your account preferences and settings.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                activeTab === "general"
                                    ? "bg-[#0f172a] text-white"
                                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <User size={18} />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                activeTab === "security"
                                    ? "bg-[#0f172a] text-white"
                                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <Lock size={18} />
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab("notifications")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                activeTab === "notifications"
                                    ? "bg-[#0f172a] text-white"
                                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <Bell size={18} />
                            Notifications
                        </button>

                        <div className="h-px bg-[#ede9fe] my-2" />

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {activeTab === "general" && (
                            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-[#1e1b4b] mb-4 flex items-center gap-2">
                                    <User size={20} className="text-blue-500" />
                                    General Profile
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={user?.name || "Admin"}
                                            className="w-full bg-gray-50 border border-[#ede9fe] rounded-lg px-4 py-2.5 text-sm text-gray-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email / Phone</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={user?.phone || user?.email || "admin@fixkar.com"}
                                            className="w-full bg-gray-50 border border-[#ede9fe] rounded-lg px-4 py-2.5 text-sm text-gray-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                                        <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full capitalize">
                                            {user?.role || "Admin"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-[#1e1b4b] mb-4 flex items-center gap-2">
                                    <Lock size={20} className="text-purple-500" />
                                    Security & Access
                                </h2>
                                <p className="text-sm text-gray-500 mb-5">
                                    Manage your password and security settings here.
                                </p>
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-white border border-[#ede9fe] rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            className="w-full bg-white border border-[#ede9fe] rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <button className="bg-[#0f172a] text-white text-sm font-semibold px-5 py-2.5 rounded-lg mt-2">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-[#1e1b4b] mb-4 flex items-center gap-2">
                                    <Bell size={20} className="text-yellow-500" />
                                    Notification Preferences
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-[#ede9fe]">
                                        <div>
                                            <p className="text-sm font-bold text-[#1e1b4b]">Push Notifications</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Receive alerts for new bookings and reports.</p>
                                        </div>
                                        <button
                                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                notificationsEnabled ? "bg-green-500" : "bg-gray-300"
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-[#ede9fe]">
                                        <div>
                                            <p className="text-sm font-bold text-[#1e1b4b]">Email Alerts</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Get daily summaries delivered to your email.</p>
                                        </div>
                                        <button
                                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-300 cursor-not-allowed"
                                        >
                                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
