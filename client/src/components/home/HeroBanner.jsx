import { Camera } from "lucide-react";

// Navy hero banner with greeting, worker emoji, and scan CTA.
// userName comes from authStore later — for now a prop with a default.
export default function HeroBanner({ userName = "Arjun", onScanClick }) {
    return (
        <div className="relative bg-[#0f172a] rounded-[20px] px-7 py-6 flex items-center justify-between overflow-hidden min-h-[140px] mb-5">
            {/* Decorative circles */}
            <div className="absolute right-[100px] -top-10 w-[130px] h-[130px] rounded-full bg-[#1a2744] opacity-60" />
            <div className="absolute right-[60px] -bottom-8 w-[90px] h-[90px] rounded-full bg-[#1e3a6e] opacity-40" />

            {/* Left content */}
            <div className="relative z-10">
                <p className="text-[13px] text-blue-300 mb-1">Good morning 👋</p>
                <h2 className="text-[22px] font-bold text-white leading-tight mb-3.5 tracking-tight">
                    {userName}
                </h2>
                <button
                    onClick={onScanClick}
                    className="flex items-center gap-1.5 bg-white text-[#0f172a] text-[13px] font-semibold rounded-[10px] px-5 py-2.5"
                >
                    <Camera size={16} />
                    Scan problem now
                </button>
            </div>

            {/* Worker illustration */}
            <div className="relative z-10 text-[90px] leading-none drop-shadow-lg">
                👷
            </div>
        </div>
    );
}