import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import StarRating from "../../components/review/StarRating";
import { reviewService } from "../../services/reviewService";

const QUESTIONS = [
    { key: "punctualityRating", label: "Did the worker arrive on time?" },
    { key: "behaviourRating", label: "Behaviour and communication" },
    { key: "qualityRating", label: "Quality of work done" },
    { key: "cleanlinessRating", label: "Did the worker clean up after?" },
    { key: "problemFixedRating", label: "Was the core problem fully fixed?" },
];

export default function LeaveReview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ratings, setRatings] = useState({
        punctualityRating: 0,
        behaviourRating: 0,
        qualityRating: 0,
        cleanlinessRating: 0,
        problemFixedRating: 0,
    });
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const allRated = Object.values(ratings).every((v) => v > 0);
    const commentValid = comment.trim().length >= 10;
    const canSubmit = allRated && commentValid;

    const handleRate = (key, value) => {
        setRatings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError("");
        try {
            await reviewService.submit(id, { ...ratings, comment: comment.trim() });
            navigate(`/bookings/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || "Could not submit review. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">Leave a Review</h1>
                    <p className="text-xs text-gray-500">All fields required — payment is released after this</p>
                </div>
            </div>

            <div className="max-w-[480px] mx-auto mt-6 flex flex-col gap-4">

                {/* Star questions */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl px-4 py-1">
                    {QUESTIONS.map((q) => (
                        <StarRating
                            key={q.key}
                            label={q.label}
                            value={ratings[q.key]}
                            onChange={(val) => handleRate(q.key, val)}
                        />
                    ))}
                </div>

                {/* Written review */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-2">
                        Describe your experience
                    </p>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What went well? Anything that could be better?"
                        rows={3}
                        className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5 text-sm text-[#1e1b4b] placeholder:text-gray-400 outline-none resize-none font-[Poppins]"
                    />
                    {!commentValid && comment.length > 0 && (
                        <p className="text-[11px] text-orange-500 mt-1.5">
                            {10 - comment.trim().length} more characters needed
                        </p>
                    )}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3.5 disabled:opacity-40"
                >
                    {loading ? "Submitting..." : "Submit & Release Payment"}
                </button>

                {!canSubmit && (
                    <p className="text-[11px] text-gray-400 text-center -mt-1">
                        Rate all categories and write at least 10 characters to continue
                    </p>
                )}
            </div>
        </PageWrapper>
    );
}