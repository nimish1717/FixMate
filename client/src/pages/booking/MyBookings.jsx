import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import BookingCard from "../../components/booking/BookingCard";
import { bookingService } from "../../services/bookingService";
import { SERVICE_CATEGORIES, STATUS_STYLES } from "../../utils/constants";

const FILTERS = ["All", "Active", "Completed", "Cancelled"];

// Maps raw backend status -> display status used by BookingCard's STATUS_STYLES
function mapStatusToDisplay(status) {
    if (status === "completed" || status === "payment_completed" || status === "review_submitted") return "Completed";
    if (status === "cancelled") return "Cancelled";
    if (status === "pending") return "Pending";
    return "Scheduled"; // accepted, arrival_verified, repair_verified, payment_pending, etc.
}

function getCategoryEmoji(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId)?.emoji || "🔧";
}

export default function MyBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const [dateRange, setDateRange] = useState("");

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            try {
                const data = await bookingService.getMyBookings(dateRange);
                setBookings(data.bookings || data || []);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load bookings.");
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [dateRange]);

    const filtered = bookings.filter((b) => {
        if (activeFilter === "All") return true;
        const display = mapStatusToDisplay(b.status);
        if (activeFilter === "Active") return display === "Scheduled" || display === "Pending";
        return display === activeFilter;
    });

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-[#1e1b4b]">My Bookings</h1>
            </div>

            <div className="max-w-[560px] mx-auto mt-6">

                {/* Filter tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors shrink-0 ${activeFilter === f
                                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                                        : "bg-white text-gray-500 border-[#ede9fe]"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#ede9fe] bg-white text-gray-600 outline-none shrink-0"
                    >
                        <option value="">All Time</option>
                        <option value="this_month">This Month</option>
                        <option value="last_3_months">Last 3 Months</option>
                    </select>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col gap-2.5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[72px] animate-pulse" />
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
                {!loading && !error && filtered.length === 0 && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center">
                        <div className="w-14 h-14 bg-[#f8f7ff] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                            📋
                        </div>
                        <p className="text-sm font-semibold text-[#1e1b4b] mb-1">No bookings here</p>
                        <p className="text-xs text-gray-500">
                            {activeFilter === "All"
                                ? "Your bookings will show up here once you book a service."
                                : `No ${activeFilter.toLowerCase()} bookings.`}
                        </p>
                    </div>
                )}

                {/* List */}
                <div className="flex flex-col gap-2.5">
                    {filtered.map((booking, i) => {
                        const card = {
                            id: booking._id,
                            workerName: booking.worker?.user?.name || "Worker",
                            meta: `${getCategoryEmoji(booking.category)} ${booking.category} · ${new Date(
                                booking.createdAt
                            ).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
                            status: mapStatusToDisplay(booking.status),
                            trustScore: booking.worker?.trustScore ?? "—",
                            rawBooking: booking,
                        };

                        const handleRebook = (rawBooking) => {
                            navigate("/booking/create", {
                                state: {
                                    worker: rawBooking.worker,
                                    category: rawBooking.category,
                                }
                            });
                        };

                        return (
                            <BookingCard
                                key={booking._id}
                                booking={card}
                                avatarIndex={i}
                                onClick={() => navigate(`/bookings/${booking._id}`)}
                                onRebook={handleRebook}
                            />
                        );
                    })}
                </div>
            </div>
        </PageWrapper>
    );
}