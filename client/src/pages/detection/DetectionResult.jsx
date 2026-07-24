import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { SERVICE_CATEGORIES } from "../../utils/constants";

// Maps backend category IDs to emoji + label for display.
// Falls back gracefully if backend returns a category not in our list.
function getCategoryInfo(categoryId) {
    const match = SERVICE_CATEGORIES.find((c) => c.id === categoryId);
    return match || { id: categoryId, label: categoryId, emoji: "🔧" };
}

export default function DetectionResult() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data passed from AIDetect.jsx via navigate state
    const { result, previewUrl, issueFile } = location.state || {};

    // If someone lands here directly without state, send them back
    if (!result) {
        return (
            <PageWrapper>
                <div className="max-w-[480px] mx-auto text-center py-20">
                    <p className="text-sm text-gray-500 mb-4">No detection result found.</p>
                    <button
                        onClick={() => navigate("/detect")}
                        className="text-sm font-semibold text-[#0f172a]"
                    >
                        ← Go back and scan again
                    </button>
                </div>
            </PageWrapper>
        );
    }

    const detected = getCategoryInfo(result.predictedCategory);
    const confidencePercent = Math.round((result.confidence || 0) * 100);

    // "Other possibilities" — backend may or may not send this.
    // Render empty state gracefully if missing.
    const alternatives = result.alternatives || [];

    const handleContinue = () => {
        navigate(`/workers?category=${detected.id}`, {
            state: { previewUrl, detectedCategory: detected.id, issueFile },
        });
    };

    const handleChangeCategory = () => {
        navigate("/detect/choose-category", {
            state: { previewUrl, issueFile },
        });
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">Detection Result</h1>
                    <p className="text-xs text-gray-500">Step 2 of 2</p>
                </div>
            </div>

            <div className="max-w-[480px] mx-auto mt-6">
                {/* Photo preview (small) */}
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="Uploaded issue"
                        className="w-full h-[140px] object-cover rounded-2xl mb-4"
                    />
                )}

                {/* Detected category card */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-5 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Detected Category</p>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{detected.emoji}</span>
                        <span className="text-lg font-bold text-[#1e1b4b] capitalize">
                            {detected.label}
                        </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-1.5">Confidence Score</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#f8f7ff] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#0f172a] rounded-full"
                                style={{ width: `${confidencePercent}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-[#1e1b4b]">
                            {confidencePercent}%
                        </span>
                    </div>
                </div>

                {/* Other possibilities — only if backend sends them */}
                {alternatives.length > 0 && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 mb-5">
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-2.5">
                            Other Possibilities
                        </p>
                        <div className="space-y-2">
                            {alternatives.map((alt) => {
                                const info = getCategoryInfo(alt.category);
                                return (
                                    <div
                                        key={alt.category}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <span className="flex items-center gap-1.5 text-gray-600">
                                            <span>{info.emoji}</span>
                                            <span className="capitalize">{info.label}</span>
                                        </span>
                                        <span className="text-gray-400">
                                            {Math.round((alt.confidence || 0) * 100)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleChangeCategory}
                        className="flex-1 border border-[#ede9fe] text-[#1e1b4b] text-sm font-semibold rounded-[10px] py-3"
                    >
                        Change Category
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-1 bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3"
                    >
                        Continue →
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
}