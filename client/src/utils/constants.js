// Single source of truth for service categories.
// Adding a new service = add one object here. Nothing else changes.
export const SERVICE_CATEGORIES = [
    { id: "plumbing", label: "Plumber", emoji: "💧" },
    { id: "electrical", label: "Electrician", emoji: "⚡" },
    { id: "carpentry", label: "Carpenter", emoji: "🪚" },
    { id: "ac_repair", label: "AC Repair", emoji: "❄️" },
    { id: "ro_repair", label: "RO Repair", emoji: "💧" },
    { id: "cleaning", label: "Cleaning", emoji: "🧹" },
    { id: "painting", label: "Painting", emoji: "🖌️" },
    { id: "pest", label: "Pest Control", emoji: "🐛" },
];

// Booking status → pill colors. Used by BookingCard.
export const STATUS_STYLES = {
    Completed: { bg: "bg-green-100", text: "text-green-700" },
    Scheduled: { bg: "bg-orange-100", text: "text-orange-700" },
    Pending: { bg: "bg-blue-100", text: "text-blue-700" },
    Cancelled: { bg: "bg-red-100", text: "text-red-700" },
};

// Avatar background colors — cycled by index for visual variety
export const AVATAR_COLORS = [
    { bg: "bg-blue-100", text: "text-blue-800" },
    { bg: "bg-yellow-100", text: "text-yellow-800" },
    { bg: "bg-pink-100", text: "text-pink-800" },
    { bg: "bg-green-100", text: "text-green-800" },
    { bg: "bg-purple-100", text: "text-purple-800" },
];