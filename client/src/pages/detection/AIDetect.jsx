import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { mlService } from "../../services/mlService";

export default function AIDetect() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setError("");
    };

    const handleContinue = async () => {
        if (!file) {
            setError("Please choose a photo first");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const result = await mlService.predictCategory(file);
            // Pass result + preview + the original File to result page via router state
            navigate("/detect/result", {
                state: { result, previewUrl: preview, issueFile: file },
            });
        } catch (err) {
            setError(
                err.response?.data?.message || "Could not analyze image. Try again."
            );
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
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">AI Problem Detection</h1>
                    <p className="text-xs text-gray-500">Step 1 of 2</p>
                </div>
            </div>

            <div className="max-w-[480px] mx-auto mt-6">
                {/* Upload box */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-2 border-dashed border-[#ede9fe] rounded-2xl flex flex-col items-center justify-center py-14 cursor-pointer hover:border-[#0f172a] transition-colors"
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Selected issue"
                            className="max-h-[200px] rounded-xl object-cover"
                        />
                    ) : (
                        <>
                            <div className="w-14 h-14 rounded-full bg-[#f8f7ff] flex items-center justify-center mb-3">
                                <Upload size={24} className="text-[#0f172a]" />
                            </div>
                            <p className="text-sm font-medium text-[#1e1b4b] mb-1">
                                Upload a clear photo
                            </p>
                            <p className="text-xs text-gray-500">of the problem</p>
                        </>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {preview && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#0f172a] mt-3"
                    >
                        Choose a different photo
                    </button>
                )}

                {/* Tips */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 mt-5">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-2">
                        Tips for better results
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1.5">
                        <li>✅ Use natural light</li>
                        <li>✅ Capture the affected area clearly</li>
                        <li>✅ Avoid blurry images</li>
                    </ul>
                </div>

                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

                {/* Continue */}
                <button
                    onClick={handleContinue}
                    disabled={!file || loading}
                    className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3.5 mt-5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        "Continue →"
                    )}
                </button>
            </div>
        </PageWrapper>
    );
}