import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../store/notificationStore";
import { Search, Bell, AlertTriangle, Menu } from "lucide-react";
import ComingSoonModal from "../ui/ComingSoonModal";

import { useSearchStore } from "../../store/searchStore";

export default function Topbar({ onMenuClick }) {
    const navigate = useNavigate();
    const [showSOSModal, setShowSOSModal] = useState(false);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const { searchQuery, setSearchQuery } = useSearchStore();

    return (
        <>
            <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-[#ede9fe] sticky top-0 z-10 gap-3">
                {/* Left side: Hamburger + Search */}
                <div className="flex items-center gap-3 w-full max-w-[300px]">
                    <button 
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-[#f8f7ff] rounded-xl flex-shrink-0"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-2.5 w-full">
                        <Search size={16} className="text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* SOS — full text on md, just SOS on mobile */}
                    <button
                        onClick={() => setShowSOSModal(true)}
                        className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 rounded-[10px] px-3 md:px-4 py-2 text-xs font-semibold text-red-500 cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 hidden md:block" />
                        <span className="hidden md:inline">Emergency SOS — tap for instant dispatch</span>
                        <span className="md:hidden">SOS</span>
                    </button>

                    {/* Notifications bell */}
                    <button
                        onClick={() => navigate("/notifications")}
                        className="relative w-9 h-9 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                        <Bell size={18} className="text-gray-500" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0f172a] border-2 border-white" />
                        )}
                    </button>
                </div>
            </div>

            {/* SOS placeholder modal */}
            <ComingSoonModal
                open={showSOSModal}
                onClose={() => setShowSOSModal(false)}
                icon={<AlertTriangle size={28} className="text-red-500" />}
                title="Emergency SOS"
                message="Emergency dispatch will be integrated in a future update. For real emergencies, please call 112 directly."
            />
        </>
    );
}