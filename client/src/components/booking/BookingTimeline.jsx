import { Check } from "lucide-react";

// Maps backend booking statuses to ordered timeline steps.
// Add new statuses here only — rendering logic never changes.
const TIMELINE_STEPS = [
  { key: "pending",             label: "Booking Created" },
  { key: "accepted",            label: "Accepted by Worker" },
  { key: "arrival_verified",    label: "Worker Arrived (OTP verified)" },
  { key: "price_negotiation",   label: "Price Negotiated" },
  { key: "in_progress",         label: "Repair Started" },
  { key: "repair_verified",     label: "AI Verified Repair" },
  { key: "payment_pending",     label: "Completion OTP Verified" },
  { key: "payment_completed",   label: "Payment Completed" },
  { key: "review_submitted",    label: "Review Submitted" },
];

export default function BookingTimeline({ currentStatus }) {
    const currentIndex = TIMELINE_STEPS.findIndex((s) => s.key === currentStatus);

    return (
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#1e1b4b] mb-4">Booking Timeline</p>

            <div className="flex flex-col">
                {TIMELINE_STEPS.map((step, i) => {
                    const isDone = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    const isPending = i > currentIndex;

                    return (
                        <div key={step.key} className="flex gap-3">
                            {/* Dot + connecting line */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone
                                            ? "bg-green-500"
                                            : isCurrent
                                                ? "bg-[#0f172a]"
                                                : "bg-gray-200"
                                        }`}
                                >
                                    {isDone && <Check size={12} className="text-white" />}
                                </div>
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div
                                        className={`w-[2px] flex-1 ${isDone ? "bg-green-500" : "bg-gray-200"
                                            }`}
                                        style={{ minHeight: 24 }}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <div className="pb-6">
                                <p
                                    className={`text-sm font-medium ${isDone || isCurrent ? "text-[#1e1b4b]" : "text-gray-400"
                                        }`}
                                >
                                    {step.label}
                                </p>
                                {isCurrent && (
                                    <p className="text-[11px] text-[#0f172a] font-medium mt-0.5">In progress</p>
                                )}
                                {isPending && (
                                    <p className="text-[11px] text-gray-400 mt-0.5">Pending</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}