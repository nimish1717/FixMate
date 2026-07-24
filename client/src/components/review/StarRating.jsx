import { Star } from "lucide-react";

// Reusable 1-5 star input. value/onChange pattern — works like a controlled input.
export default function StarRating({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-[#ede9fe] last:border-b-0">
            <span className="text-sm text-[#1e1b4b]">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-0.5"
                    >
                        <Star
                            size={20}
                            className={star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}