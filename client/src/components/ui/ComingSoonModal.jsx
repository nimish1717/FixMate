import { X } from "lucide-react";

// Reusable modal for any feature not yet wired to backend.
// Usage: <ComingSoonModal open={bool} onClose={fn} title="..." message="..." icon={<Icon />} />
export default function ComingSoonModal({ open, onClose, title, message, icon }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-6 w-[340px] shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#f8f7ff] flex items-center justify-center">
                        {icon}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <h3 className="text-base font-semibold text-[#1e1b4b] mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-2.5"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}