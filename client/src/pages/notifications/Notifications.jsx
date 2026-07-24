import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { notificationService } from "../../services/notificationService";
import { useNotificationStore } from "../../store/notificationStore";

// Maps notification "title" field to an emoji for quick visual scanning.
// Falls back to a bell if title is unknown — never breaks on new types.
const TYPE_EMOJI = {
    "Booking Accepted": "✅",
    "Worker Arrived": "📍",
    "Arrival Verified": "📍",
    "Price Quoted": "💰",
    "Payment Received": "💰",
    "Repair Completed": "🤖",
};

export default function Notifications() {
    const navigate = useNavigate();
    const reset = useNotificationStore((state) => state.reset);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const data = await notificationService.getAll();
                setNotifications(data.notifications || data || []);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load notifications.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            reset();
        } catch {
            // silent fail — non-critical
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationService.markRead(notification._id);
                setNotifications((prev) =>
                    prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
                );
            } catch {
                // silent fail
            }
        }
        // If notification references a booking, go there
        if (notification.data?.bookingId) {
            navigate(`/bookings/${notification.data.bookingId}`);
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hr ago`;
        return `${Math.floor(hrs / 24)} day ago`;
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-400">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">Notifications</h1>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#0f172a]"
                    >
                        <CheckCheck size={14} />
                        Mark all read
                    </button>
                )}
            </div>

            <div className="max-w-[560px] mx-auto mt-6">

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col gap-2.5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[60px] animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && notifications.length === 0 && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center">
                        <div className="w-14 h-14 bg-[#f8f7ff] rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell size={22} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-[#1e1b4b] mb-1">All caught up</p>
                        <p className="text-xs text-gray-500">You have no notifications right now.</p>
                    </div>
                )}

                {/* List */}
                <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                        <button
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left bg-white border rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-colors ${n.isRead ? "border-[#ede9fe]" : "border-[#0f172a]"
                                }`}
                        >
                            <span className="text-lg leading-none mt-0.5">
                                {TYPE_EMOJI[n.title] || "🔔"}
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-[#1e1b4b]">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#0f172a] flex-shrink-0 mt-1.5" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
}