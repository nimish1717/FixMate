import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import BookingCard from "../../components/booking/BookingCard";
import { bookingService } from "../../services/bookingService";
import { SERVICE_CATEGORIES } from "../../utils/constants";

function mapStatusToDisplay(status) {
    if (status === "completed" || status === "payment_completed" || status === "review_submitted") return "Completed";
    if (status === "cancelled") return "Cancelled";
    if (status === "pending") return "Pending";
    return "Active"; 
}

function getCategoryEmoji(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId)?.emoji || "🔧";
}

export default function WorkerHistory() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("Completed");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // getWorkerBookings returns all worker bookings
                const res = await bookingService.getWorkerBookings();
                const all = res.bookings || res || [];
                
                // Filter only completed or cancelled for the history page
                const historyBookings = all.filter(b => {
                    const status = mapStatusToDisplay(b.status);
                    return status === "Completed" || status === "Cancelled";
                });
                setBookings(historyBookings);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load history.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filtered = bookings.filter((b) => mapStatusToDisplay(b.status) === activeFilter);

    return (
        <PageWrapper>
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#1e1b4b] transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-[#1e1b4b]">Job History</h1>
            </div>
            
            <div className="max-w-[560px] mx-auto mt-6">
                <div className="flex gap-2 mb-6">
                    {["Completed", "Cancelled"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                                activeFilter === f
                                    ? "bg-[#0f172a] text-white border-[#0f172a]"
                                    : "bg-white text-gray-500 border-[#ede9fe]"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex flex-col gap-2.5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[72px] animate-pulse" />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center">
                        <p className="text-sm font-semibold text-[#1e1b4b] mb-1">No {activeFilter.toLowerCase()} jobs</p>
                        <p className="text-xs text-gray-500">
                            Your past jobs will appear here once finished.
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-2.5">
                    {filtered.map((booking, i) => {
                        const card = {
                            id: booking._id,
                            workerName: booking.user?.name || "Customer", // for worker view, show customer name
                            meta: `${getCategoryEmoji(booking.category)} ${booking.category} · ${new Date(
                                booking.createdAt
                            ).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
                            status: mapStatusToDisplay(booking.status),
                            trustScore: "—", // we don't score users yet
                        };
                        return (
                            <BookingCard
                                key={booking._id}
                                booking={card}
                                avatarIndex={i}
                                onClick={() => navigate(`/bookings/${booking._id}`)}
                            />
                        );
                    })}
                </div>
            </div>
        </PageWrapper>
    );
}
