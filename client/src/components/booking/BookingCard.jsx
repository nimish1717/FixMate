import { AVATAR_COLORS, STATUS_STYLES } from "../../utils/constants";

// Single booking row. Used in Home's "Recent Bookings" and later in MyBookings.jsx.
// booking shape: { id, workerName, category, meta, status, trustScore }
export default function BookingCard({ booking, avatarIndex = 0, onClick, onRebook }) {
    const avatar = AVATAR_COLORS[avatarIndex % AVATAR_COLORS.length];
    const status = STATUS_STYLES[booking.status] || STATUS_STYLES.Pending;
    const initial = booking.workerName?.charAt(0).toUpperCase() || "?";

    return (
        <button
            onClick={onClick}
            className="w-full bg-white border border-[#ede9fe] rounded-2xl px-4.5 py-3.5 flex items-center justify-between text-left"
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${avatar.bg} ${avatar.text}`}
                >
                    {initial}
                </div>
                <div>
                    <div className="text-[13px] font-semibold text-[#1e1b4b] mb-0.5">
                        {booking.workerName}
                    </div>
                    <div className="text-[11px] text-gray-500">{booking.meta}</div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-3">
                    <span
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}
                    >
                        {booking.status}
                    </span>
                    <span className="text-[15px] font-bold text-[#0f172a]">
                        {booking.trustScore}
                    </span>
                </div>
                {onRebook && booking.status === "Completed" && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); onRebook(booking.rawBooking); }}
                        className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100"
                    >
                        Book Again
                    </div>
                )}
            </div>
        </button>
    );
}