import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { SERVICE_CATEGORIES } from "../../utils/constants";

export default function ChooseCategory() {
    const navigate = useNavigate();
    const location = useLocation();

    // We expect the previewUrl from the previous page's state
    const { previewUrl, issueFile } = location.state || {};

    const handleSelectCategory = (cat) => {
        // Navigate to worker search with the chosen category ID
        navigate(`/workers?category=${cat.id}`, {
            state: { previewUrl, detectedCategory: cat.id, issueFile },
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
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">Choose Category</h1>
                    <p className="text-xs text-gray-500">Manual Override</p>
                </div>
            </div>

            <div className="max-w-[480px] mx-auto mt-6">
                {/* Photo preview (small) */}
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Uploaded issue"
                        className="w-full h-[140px] object-cover rounded-2xl mb-6"
                    />
                ) : (
                    <div className="w-full h-[140px] bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-xs text-gray-400">
                        No image provided
                    </div>
                )}

                <p className="text-sm font-bold text-[#1e1b4b] mb-4">Select the correct category:</p>

                {/* Service Grid */}
                <div className="grid grid-cols-4 gap-2.5">
                    {SERVICE_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleSelectCategory(cat)}
                            className="bg-white border border-[#ede9fe] rounded-2xl py-4 px-2.5 flex flex-col items-center gap-1.5 hover:border-[#0f172a] hover:bg-[#f8f7ff] transition-colors"
                        >
                            <span className="text-2xl leading-none">{cat.emoji}</span>
                            <span className="text-[11px] font-medium text-gray-500">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
}
