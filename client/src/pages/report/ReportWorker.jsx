import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { reportService } from "../../services/reportService";
import { useToastStore } from "../../store/toastStore";

export default function ReportWorker() {
    const { id: bookingId } = useParams();
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);

    const [category, setCategory] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const CATEGORIES = [
        "Poor Workmanship",
        "Overcharging",
        "Unprofessional Behavior",
        "Did Not Show Up",
        "Damage to Property",
        "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) {
            showToast("Please select a report category", "error");
            return;
        }

        setSubmitting(true);
        try {
            const response = await reportService.submitReport({ bookingId, category, note });
            showToast(response.message || "Report submitted successfully.", "success");
            navigate(-1);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to submit report", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageWrapper>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#1e1b4b] transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-[#1e1b4b]">Report Worker</h1>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                    We take reports very seriously. This information will be sent directly to our admin team and the worker's shopkeeper for immediate review.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-[#ede9fe] rounded-2xl p-6 mb-24">
                <div className="mb-5">
                    <label className="block text-xs font-semibold text-[#1e1b4b] mb-2">What happened?</label>
                    <div className="flex flex-col gap-2">
                        {CATEGORIES.map((cat) => (
                            <label key={cat} className="flex items-center gap-3 p-3 border border-[#ede9fe] rounded-xl cursor-pointer hover:bg-[#f8f7ff] transition-colors">
                                <input
                                    type="radio"
                                    name="category"
                                    value={cat}
                                    checked={category === cat}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-4 h-4 text-[#0f172a] focus:ring-[#0f172a]"
                                />
                                <span className="text-sm font-medium text-[#1e1b4b]">{cat}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[#1e1b4b] mb-2">Additional Details (Optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Please describe the incident in more detail..."
                        rows={4}
                        className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-xl px-4 py-3 text-sm text-[#1e1b4b] outline-none focus:border-[#0f172a] resize-none"
                    />
                </div>
            </form>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#ede9fe] max-w-[480px] mx-auto z-50">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !category}
                    className="w-full bg-red-500 text-white text-sm font-semibold rounded-2xl py-3.5 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                    {submitting ? "Submitting..." : "Submit Report"}
                </button>
            </div>
        </PageWrapper>
    );
}
