import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const STYLES = {
    success: {
        bar: "bg-green-500",
        icon: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
        label: "text-green-700",
    },
    error: {
        bar: "bg-red-500",
        icon: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
        label: "text-red-700",
    },
    warning: {
        bar: "bg-orange-400",
        icon: <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />,
        label: "text-orange-700",
    },
    info: {
        bar: "bg-[#6366f1]",
        icon: <Info size={18} className="text-[#6366f1] flex-shrink-0" />,
        label: "text-[#4338ca]",
    },
};

function Toast({ id, message, type }) {
    const removeToast = useToastStore((s) => s.removeToast);
    const [visible, setVisible] = useState(false);

    // Trigger enter animation on mount
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    const style = STYLES[type] || STYLES.info;

    return (
        <div
            className={`
                relative flex items-start gap-3 w-[320px] bg-white border border-[#ede9fe]
                rounded-2xl shadow-lg px-4 py-3.5 overflow-hidden
                transform transition-all duration-300 ease-out
                ${visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}
            `}
        >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${style.bar}`} />

            {style.icon}

            <p className={`text-sm font-medium flex-1 leading-snug ${style.label}`}>
                {message}
            </p>

            <button
                onClick={() => removeToast(id)}
                className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
            >
                <X size={15} />
            </button>
        </div>
    );
}

// Mount this once in App.jsx / main.jsx — it renders all active toasts
export default function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);

    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <Toast {...t} />
                </div>
            ))}
        </div>
    );
}
