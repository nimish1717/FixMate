import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { bookingService } from "../../services/bookingService";

import PageWrapper from "../../components/layout/PageWrapper";
import HeroBanner from "../../components/home/HeroBanner";
import QuickActionCards from "../../components/home/QuickActionCards";
import ServiceGrid from "../../components/home/ServiceGrid";
import RecentBookings from "../../components/booking/RecentBookings";
import ComingSoonModal from "../../components/ui/ComingSoonModal";

export default function Home() {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [recentBookings, setRecentBookings] = useState([]);
    const [activeBookingId, setActiveBookingId] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await bookingService.getMyBookings();
                if (res.data && Array.isArray(res.data)) {
                    // Check if there is an active booking to track
                    const activeStatus = ["accepted", "arrival_verified", "in_progress", "repair_verified", "payment_pending"];
                    const active = res.data.find(b => activeStatus.includes(b.status));
                    if (active) setActiveBookingId(active._id);

                    // Map top 2 for recent list
                    setRecentBookings(res.data.slice(0, 2).map(b => ({
                        id: b._id,
                        workerName: b.worker?.name || "Pending Assignment",
                        meta: `${b.category} · ${new Date(b.createdAt).toLocaleDateString()}`,
                        status: b.status,
                        trustScore: b.worker?.rating ? Math.round(b.worker.rating * 20) : null
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch recent bookings:", err);
            }
        };
        fetchBookings();
    }, []);

    return (
        <PageWrapper>
            <HeroBanner
                userName={user?.name || "there"}
                onScanClick={() => navigate("/detect")}
            />

            <QuickActionCards
                onAIClick={() => navigate("/detect")}
                onTrackingClick={() => {
                    if (activeBookingId) {
                        navigate(`/bookings/${activeBookingId}`);
                    } else {
                        setShowTrackingModal(true);
                    }
                }}
            />

            <div className="max-w-[560px] mx-auto px-5 mb-6">
                <button 
                    onClick={() => navigate("/shops")}
                    className="w-full bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🏪</div>
                        <div className="text-left">
                            <h3 className="font-bold text-[#1e1b4b] text-sm">Nearby Hardware Shops</h3>
                            <p className="text-xs text-gray-500">Find spare parts and chat with stores</p>
                        </div>
                    </div>
                    <div className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold">
                        Search
                    </div>
                </button>
            </div>

            <ServiceGrid
                onSelectCategory={(cat) => navigate(`/workers?category=${cat.id}`)}
            />

            {recentBookings.length > 0 && (
                <RecentBookings
                    bookings={recentBookings}
                    onBookingClick={(b) => navigate(`/bookings/${b.id}`)}
                    onSeeAll={() => navigate("/bookings")}
                />
            )}

            {/* Modal shown if tracking is clicked but no active booking exists */}
            <ComingSoonModal
                open={showTrackingModal}
                onClose={() => setShowTrackingModal(false)}
                icon={<MapPin size={28} className="text-blue-500" />}
                title="No Active Bookings"
                message="You don't have any workers currently assigned or on their way. Book a service to track your worker live on the map!"
            />
        </PageWrapper>
    );
}