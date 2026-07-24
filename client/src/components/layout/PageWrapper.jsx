import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useNotifications } from "../../hooks/useNotifications";

export default function PageWrapper({ children }) {
    useNotifications(); // keeps unread badge in sync across the app
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#f8f7ff]">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    <div className="px-4 md:px-6 py-5">{children}</div>
                </main>
            </div>
        </div>
    );
}