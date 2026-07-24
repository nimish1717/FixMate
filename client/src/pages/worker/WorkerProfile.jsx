import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, ShieldCheck, MapPin, Briefcase } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { workerService } from "../../services/workerService";
import { AVATAR_COLORS } from "../../utils/constants";

export default function WorkerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const category = location.state?.category || "";

    const [worker, setWorker] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const res = await workerService.getWorkerById(id);
                setWorker(res.worker);
                setReviews(res.reviews || []);
            } catch (err) {
                setError("Worker profile not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchWorker();
    }, [id]);

    if (loading) {
        return (
            <PageWrapper>
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                    <div className="h-20 bg-gray-200 rounded-2xl" />
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                </div>
            </PageWrapper>
        );
    }

    if (error || !worker) {
        return (
            <PageWrapper>
                <div className="text-center py-20">
                    <p className="text-sm text-gray-500">{error || "Worker not found."}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-[#0f172a]">
                        ← Go back
                    </button>
                </div>
            </PageWrapper>
        );
    }

    const avatar = AVATAR_COLORS[worker._id.charCodeAt(0) % AVATAR_COLORS.length];
    const initial = worker.user?.name?.charAt(0).toUpperCase() || "W";

    return (
        <PageWrapper>
            {/* Header / Avatar Section */}
            <div className="bg-white border border-[#ede9fe] rounded-3xl p-6 text-center mb-4 relative overflow-hidden">
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-[#f8f7ff] rounded-full text-gray-500 hover:text-[#1e1b4b] transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-sm ${avatar.bg} ${avatar.text}`}>
                    {initial}
                </div>
                
                <h1 className="text-xl font-bold text-[#1e1b4b] flex items-center justify-center gap-1.5 mb-1">
                    {worker.user?.name}
                    {worker.isVerified && <ShieldCheck size={18} className="text-green-500" />}
                </h1>
                
                {worker.shopkeeper?.shopName && (
                    <p className="text-xs text-gray-500 mb-4 flex items-center justify-center gap-1">
                        <Briefcase size={12} /> verified via {worker.shopkeeper.shopName}
                    </p>
                )}
                
                <div className="flex items-center justify-center gap-4 text-sm font-semibold text-[#1e1b4b]">
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            {worker.rating?.toFixed(1) || "New"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">Rating</span>
                    </div>
                    <div className="w-px h-6 bg-[#ede9fe]" />
                    <div className="flex flex-col items-center">
                        <span className="text-green-600">{worker.trustScore ?? "—"}</span>
                        <span className="text-[10px] text-gray-400 font-normal">Trust Score</span>
                    </div>
                    <div className="w-px h-6 bg-[#ede9fe]" />
                    <div className="flex flex-col items-center">
                        <span>{worker.experience} yrs</span>
                        <span className="text-[10px] text-gray-400 font-normal">Experience</span>
                    </div>
                </div>
            </div>

            {/* Category / Skills */}
            <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold text-[#1e1b4b] mb-3">Service Category</p>
                <div className="inline-flex text-xs font-medium bg-[#f8f7ff] text-[#1e1b4b] px-3 py-1.5 rounded-full">
                    {worker.category}
                </div>
            </div>

            {/* Reviews */}
            <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 mb-24">
                <p className="text-xs font-semibold text-[#1e1b4b] mb-4">Customer Reviews</p>
                {reviews.length === 0 ? (
                    <p className="text-[11px] text-gray-500 text-center py-4">No reviews yet.</p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div key={rev._id} className="border-b border-[#ede9fe] pb-4 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#1e1b4b]">{rev.user?.name || "Customer"}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 text-yellow-400 fill-yellow-400">
                                        <Star size={12} />
                                        <span className="text-xs font-bold text-[#1e1b4b] ml-0.5">{rev.overallRating?.toFixed(1) || ((rev.punctualityRating + rev.behaviourRating + rev.qualityRating) / 3).toFixed(1)}</span>
                                    </div>
                                </div>
                                {rev.feedback && (
                                    <p className="text-[12px] text-gray-600 leading-relaxed">"{rev.feedback}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky Book Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#ede9fe] max-w-[480px] mx-auto z-50">
                <button
                    onClick={() => navigate("/booking/create", { state: { worker, category: category || worker.category } })}
                    className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-2xl py-3.5 hover:bg-[#1e1b4b] transition-colors"
                >
                    Book Now
                </button>
            </div>
        </PageWrapper>
    );
}
