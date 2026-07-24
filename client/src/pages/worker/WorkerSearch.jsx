import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, ShieldCheck, Loader2, X } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { workerService } from "../../services/workerService";
import { SERVICE_CATEGORIES, AVATAR_COLORS } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";

export default function WorkerSearch() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Parse URL query params
    const categoryId = searchParams.get("category");
    const status = searchParams.get("status") || "online";
    const experience = searchParams.get("experience") || "";
    const trustScore = searchParams.get("trustScore") || "";
    const sortBy = searchParams.get("sortBy") || "nearest";

    const categoryInfo = SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: "Service", emoji: "🔧" };

    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [locationStatus, setLocationStatus] = useState("Locating you...");
    const [debouncedFilters, setDebouncedFilters] = useState({ status, experience, trustScore, sortBy });

    const { coords, error: geoError, loading: geoLoading } = useGeolocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters({ status, experience, trustScore, sortBy });
        }, 300);
        return () => clearTimeout(timer);
    }, [status, experience, trustScore, sortBy]);

    useEffect(() => {
        const fetchNearby = async (lng, lat) => {
            setLoading(true);
            try {
                const res = await workerService.getNearbyWorkers(categoryId, lng, lat, debouncedFilters);
                setWorkers(res.workers || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch nearby workers.");
            } finally {
                setLoading(false);
            }
        };

        if (geoLoading) {
            setLocationStatus("Locating you...");
            return;
        }

        if (geoError) {
            setLocationStatus("Location denied. Using default area for testing.");
            fetchNearby(77.2090, 28.6139); // Default to New Delhi for testing
        } else if (coords) {
            setLocationStatus("");
            fetchNearby(coords.lng, coords.lat);
        }
    }, [categoryId, coords, geoError, geoLoading, debouncedFilters]);

    const updateFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(key, value);
        else newParams.delete(key);
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        const newParams = new URLSearchParams();
        if (categoryId) newParams.set("category", categoryId);
        setSearchParams(newParams);
    };

    const handleBook = (worker) => {
        navigate("/booking/create", {
            state: {
                worker,
                category: categoryId,
                previewUrl: location.state?.previewUrl,
                issueImage: location.state?.issueFile, // File object from AI detection flow
            },
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
                    <h1 className="text-lg font-semibold text-[#1e1b4b] capitalize">
                        {categoryInfo.label}s
                    </h1>
                    {locationStatus ? (
                        <p className="text-xs text-orange-500 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> {locationStatus}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> Nearby
                        </p>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                <select 
                    value={sortBy} 
                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border outline-none appearance-none ${sortBy !== "nearest" ? "bg-[#1e1b4b] text-white border-[#1e1b4b]" : "bg-white text-gray-700 border-gray-200"}`}
                >
                    <option value="nearest">Nearest First</option>
                    <option value="trustScore">Highest Trust</option>
                    <option value="experience">Most Experienced</option>
                </select>

                <select 
                    value={status} 
                    onChange={(e) => updateFilter("status", e.target.value)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border outline-none appearance-none ${status !== "online" ? "bg-[#1e1b4b] text-white border-[#1e1b4b]" : "bg-white text-gray-700 border-gray-200"}`}
                >
                    <option value="online">Online Only</option>
                    <option value="all">Show All</option>
                </select>

                <select 
                    value={experience} 
                    onChange={(e) => updateFilter("experience", e.target.value)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border outline-none appearance-none ${experience ? "bg-[#1e1b4b] text-white border-[#1e1b4b]" : "bg-white text-gray-700 border-gray-200"}`}
                >
                    <option value="">Any Experience</option>
                    <option value="1">1+ years</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                </select>

                <select 
                    value={trustScore} 
                    onChange={(e) => updateFilter("trustScore", e.target.value)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border outline-none appearance-none ${trustScore ? "bg-[#1e1b4b] text-white border-[#1e1b4b]" : "bg-white text-gray-700 border-gray-200"}`}
                >
                    <option value="">Any Trust Score</option>
                    <option value="70">70+ Score</option>
                    <option value="80">80+ Score</option>
                    <option value="90">90+ Score</option>
                </select>

                {(experience || trustScore || sortBy !== "nearest" || status !== "online") && (
                    <button 
                        onClick={clearFilters}
                        className="shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100"
                    >
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            <div className="max-w-[480px] mx-auto mt-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex gap-4 animate-pulse">
                                <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
                                <div className="flex-1 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                                    <div className="h-8 bg-gray-200 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : workers.length === 0 ? (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center mt-4">
                        <div className="w-16 h-16 bg-[#f8f7ff] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            📍
                        </div>
                        <h3 className="text-[#1e1b4b] font-bold mb-1">No workers found</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            We couldn't find any {categoryInfo.label}s matching your current filters near you.
                        </p>
                        {(experience || trustScore || status !== "online") && (
                            <button onClick={clearFilters} className="text-sm text-blue-600 font-semibold">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workers.map((worker, index) => {
                            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

                            return (
                                <div 
                                    key={worker._id} 
                                    onClick={() => navigate(`/workers/${worker._id}`, { state: { category } })}
                                    className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex gap-4 hover:border-[#0f172a] transition-colors cursor-pointer"
                                >
                                    {/* Avatar */}
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                                        {worker.user?.name?.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-0.5">
                                            <h3 className="font-bold text-[#1e1b4b] flex items-center gap-1">
                                                {worker.user?.name}
                                                {worker.isVerified && <ShieldCheck size={14} className="text-green-500" />}
                                            </h3>
                                            {worker.trustScore !== undefined && (
                                                <span className="text-sm font-bold text-green-600">{worker.trustScore}</span>
                                            )}
                                        </div>

                                        {worker.shopkeeper?.shopName && (
                                            <p className="text-[11px] text-gray-500 mb-1">via {worker.shopkeeper.shopName}</p>
                                        )}

                                        {worker.dist?.calculated && (
                                            <p className="text-[11px] text-gray-400 mb-1">
                                                {(worker.dist.calculated / 1000).toFixed(1)} km away
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                            <div className="flex items-center gap-1 font-medium text-[#1e1b4b]">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                {worker.rating?.toFixed(1) || "New"}
                                            </div>
                                            <span>•</span>
                                            <span>{worker.experience} yrs exp</span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBook(worker);
                                            }}
                                            className="w-full bg-[#f8f7ff] hover:bg-[#0f172a] text-[#1e1b4b] hover:text-white border border-[#ede9fe] text-xs font-bold py-2 rounded-lg transition-colors"
                                        >
                                            Book Now
                                        </button>
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
