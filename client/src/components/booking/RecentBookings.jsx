import BookingCard from "./BookingCard";

export default function RecentBookings({ bookings = [], onBookingClick, onSeeAll }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[#1e1b4b]">Recent Bookings</span>
                <button onClick={onSeeAll} className="text-xs font-semibold text-[#0f172a]">
                    See all
                </button>
            </div>

            <div className="flex flex-col gap-2.5">
                {bookings.length === 0 ? (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl px-4.5 py-6 text-center text-sm text-gray-400">
                        No bookings yet — your first job will show up here.
                    </div>
                ) : (
                    bookings.map((booking, i) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            avatarIndex={i}
                            onClick={() => onBookingClick(booking)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}