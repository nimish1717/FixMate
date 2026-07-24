import { useEffect, useState } from "react";
import { ArrowLeft, Star, StarHalf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../../components/layout/PageWrapper";
import { workerService } from "../../services/workerService";
import { AVATAR_COLORS } from "../../utils/constants";

const StarRating = ({ rating, size = 16 }) => {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
                if (rating >= star) {
                    return <Star key={star} size={size} className="fill-yellow-400 text-yellow-400" />;
                }
                if (rating >= star - 0.5) {
                    return <StarHalf key={star} size={size} className="fill-yellow-400 text-yellow-400" />;
                }
                return <Star key={star} size={size} className="text-gray-300" />;
            })}
        </div>
    );
};

export default function WorkerReviews() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await workerService.getReviews();
                setReviews(data.reviews || []);
            } catch (err) {
                setError("Failed to load reviews");
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const getAverage = (review) => {
        return (review.punctualityRating + review.behaviourRating + review.qualityRating + review.cleanlinessRating + review.problemFixedRating) / 5;
    };

    return (
        <PageWrapper>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#1e1b4b] transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-[#1e1b4b]">My Reviews</h1>
            </div>

            <div className="max-w-[600px] mx-auto">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-[180px] border border-[#ede9fe] animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-2xl border border-[#ede9fe] p-8 text-center text-red-500">
                        {error}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#ede9fe] p-10 text-center">
                        <div className="w-16 h-16 bg-[#f8f7ff] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={32} className="text-indigo-300" />
                        </div>
                        <h2 className="text-lg font-bold text-[#1e1b4b] mb-1">No Reviews Yet</h2>
                        <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
                            Complete more jobs and ask customers to rate your service!
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {reviews.map((review, i) => {
                            const avg = getAverage(review);
                            const customerName = review.user?.name || "Customer";
                            const initial = customerName.charAt(0).toUpperCase();
                            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            
                            return (
                                <div key={review._id} className="bg-white rounded-2xl border border-[#ede9fe] p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            {review.user?.profileImage ? (
                                                <div className="w-10 h-10 rounded-full border border-[#ede9fe] overflow-hidden flex-shrink-0">
                                                    <img src={review.user.profileImage} alt={customerName} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                                                    {initial}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-[#1e1b4b]">{customerName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                    {review.booking?.category && ` • ${review.booking.category}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 bg-[#f8f7ff] px-2.5 py-1 rounded-full border border-[#ede9fe]">
                                                <Star className="fill-yellow-400 text-yellow-400" size={14} />
                                                <span className="text-sm font-bold text-[#1e1b4b]">{avg.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-[#0f172a] mb-4">"{review.comment}"</p>

                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-[#f8f7ff] p-3 rounded-xl border border-[#ede9fe]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Punctuality</span>
                                            <StarRating rating={review.punctualityRating} size={12} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Behaviour</span>
                                            <StarRating rating={review.behaviourRating} size={12} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Quality</span>
                                            <StarRating rating={review.qualityRating} size={12} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Cleanliness</span>
                                            <StarRating rating={review.cleanlinessRating} size={12} />
                                        </div>
                                        <div className="flex items-center justify-between col-span-2 mt-1 pt-1 border-t border-[#ede9fe]">
                                            <span className="text-xs font-medium text-gray-600">Problem Fixed</span>
                                            <StarRating rating={review.problemFixedRating} size={12} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
