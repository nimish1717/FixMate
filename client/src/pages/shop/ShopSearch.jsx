import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, ShieldCheck, Loader2, MessageSquare } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { shopService } from "../../services/shopService";
import { inquiryService } from "../../services/inquiryService";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useToastStore } from "../../store/toastStore";

export default function ShopSearch() {
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);
    const { coords, error: geoError, loading: geoLoading } = useGeolocation();

    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [locationStatus, setLocationStatus] = useState("Locating you...");
    const [creatingInquiry, setCreatingInquiry] = useState(false);

    useEffect(() => {
        const fetchNearby = async (lat, lng) => {
            setLoading(true);
            try {
                const res = await shopService.getNearbyShops(lat, lng);
                setShops(res.shops || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch nearby shops.");
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
            fetchNearby(28.6139, 77.2090); // Default to New Delhi
        } else if (coords) {
            setLocationStatus("");
            fetchNearby(coords.lat, coords.lng);
        }
    }, [coords, geoError, geoLoading]);

    const handleInquire = async (shopId) => {
        setCreatingInquiry(true);
        try {
            const res = await inquiryService.createOrGetInquiry(shopId);
            if (res.success && res.inquiry) {
                navigate(`/chat/inquiry/${res.inquiry._id}`);
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Could not open chat with shop", "error");
        } finally {
            setCreatingInquiry(false);
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
                    <h1 className="text-lg font-semibold text-[#1e1b4b] capitalize">
                        Nearby Shops
                    </h1>
                    {locationStatus ? (
                        <p className="text-xs text-orange-500 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> {locationStatus}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> Local Hardware Stores
                        </p>
                    )}
                </div>
            </div>

            <div className="max-w-[480px] mx-auto mt-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0" />
                                <div className="flex-1 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : shops.length === 0 ? (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center mt-4">
                        <div className="w-16 h-16 bg-[#f8f7ff] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🏪
                        </div>
                        <h3 className="text-[#1e1b4b] font-bold mb-1">No verified shops found</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            We couldn't find any FixKar verified hardware stores in your immediate vicinity.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {shops.map((shop) => (
                            <div 
                                key={shop._id} 
                                className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:border-[#0f172a] transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-bold text-[#1e1b4b] flex items-center gap-1.5 text-base">
                                            {shop.shopName}
                                            {shop.shopkeeperId?.isVerified && (
                                                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                                                    <ShieldCheck size={12} /> Verified
                                                </div>
                                            )}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <MapPin size={12} /> {shop.address}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Owner: {shop.shopkeeperId?.user?.name || "Unknown"}
                                    </p>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <button
                                        onClick={() => handleInquire(shop._id)}
                                        disabled={creatingInquiry}
                                        className="w-full md:w-auto bg-[#0f172a] hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={14} />
                                        Inquire Parts
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
