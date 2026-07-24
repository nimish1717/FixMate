import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck, MapPin, IndianRupee } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { bookingService } from "../../services/bookingService";
import { useGeolocation } from "../../hooks/useGeolocation";
import { SERVICE_CATEGORIES } from "../../utils/constants";
import ComingSoonModal from "../../components/ui/ComingSoonModal";
import MapPicker from "../../components/booking/MapPicker";
import MockPaymentGateway from "../../components/ui/MockPaymentGateway";

function getCategoryInfo(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: categoryId, emoji: "🔧" };
}

export default function CreateBooking() {
    const navigate = useNavigate();
    const routeLocation = useLocation();
    const { worker, category, previewUrl, issueImage } = routeLocation.state || {};
    const { coords } = useGeolocation();

    const [selectedCoords, setSelectedCoords] = useState(null);

    useEffect(() => {
        if (coords && !selectedCoords) {
            setSelectedCoords(coords);
        }
    }, [coords]);

    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [scheduleDate, setScheduleDate] = useState("");
    const [manualImage, setManualImage] = useState(null);
    const [manualPreview, setManualPreview] = useState(previewUrl || "");

    const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "upi"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);

    const categoryInfo = getCategoryInfo(category);
    const workerName = worker?.user?.name || "Worker";
    const shopName = worker?.shopkeeper?.shopName;
    const trustScore = worker?.trustScore;

    // If someone lands here without picking a worker, send them back
    if (!worker) {
        return (
            <PageWrapper>
                <div className="max-w-[480px] mx-auto text-center py-20">
                    <p className="text-sm text-gray-500 mb-4">No worker selected.</p>
                    <button onClick={() => navigate("/")} className="text-sm font-semibold text-[#0f172a]">
                        ← Go back home
                    </button>
                </div>
            </PageWrapper>
        );
    }

    const handlePaymentSelect = (method) => {
        if (method === "upi") {
            setShowUpiModal(true);
            return;
        }
        setPaymentMethod(method);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setManualImage(file);
            setManualPreview(URL.createObjectURL(file));
        }
    };

    const handleConfirm = async () => {
        if (!selectedCoords) {
            setError("Location access is required to book a worker.");
            return;
        }
        if (!address.trim()) {
            setError("Please enter your service address.");
            return;
        }

        setError("");
        // Show the mock payment gateway instead of directly creating booking
        setShowPaymentGateway(true);
    };

    const processBooking = async () => {
        setLoading(true);
        setShowPaymentGateway(false);
        setError("");

        try {
            const finalImage = manualImage || issueImage || null;

            const lat = selectedCoords.lat || selectedCoords.latitude;
            const lng = selectedCoords.lng || selectedCoords.longitude;

            const result = await bookingService.create({
                workerId: worker._id || worker.id,
                category,
                location: { lat, lng },
                address,
                issueImage: finalImage,
                issueDescription: notes,
                scheduledAt: scheduleDate,
            });

            const bookingId = result.booking?._id || result.bookingId || result._id;
            navigate(`/bookings/${bookingId}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to create booking. Please try again.");
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
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">Confirm Booking</h1>
                    <p className="text-xs text-gray-500">{categoryInfo.emoji} {categoryInfo.label}</p>
                </div>
            </div>

            <div className="max-w-[480px] mx-auto mt-6 flex flex-col gap-4">

                {/* Worker summary card */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[10px] bg-blue-100 text-blue-800 flex items-center justify-center text-base font-bold flex-shrink-0">
                            {workerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-[#1e1b4b]">{workerName}</span>
                                {worker.isVerified && <ShieldCheck size={14} className="text-green-500" />}
                            </div>
                            {shopName && <p className="text-[11px] text-gray-500">via {shopName}</p>}
                        </div>
                    </div>
                    {trustScore && <span className="text-sm font-bold text-green-600">{trustScore}</span>}
                </div>

                {/* Issue photo preview or manual upload */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-2">Issue photo (optional)</p>
                    {manualPreview ? (
                        <div className="relative">
                            <img src={manualPreview} alt="Issue" className="w-full h-[120px] object-cover rounded-xl" />
                            {!issueImage && ( // only show change button if not from AI flow
                                <label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer shadow text-[#0f172a]">
                                    Change
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    ) : (
                        <label className="w-full h-[80px] bg-[#f8f7ff] border-2 border-dashed border-[#ede9fe] rounded-xl flex items-center justify-center text-xs font-semibold text-[#0f172a] cursor-pointer hover:bg-[#ede9fe]/30 transition-colors">
                            <span className="flex items-center gap-2">📷 Tap to upload issue photo (optional)</span>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    )}
                </div>

                {/* Notes & Date */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-2 flex items-center gap-1.5">
                        📝 Problem details & scheduling
                    </p>
                    <div className="space-y-3">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the problem (e.g., tap dripping, gate code 1234)..."
                            rows={2}
                            className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5 text-sm text-[#1e1b4b] placeholder:text-gray-400 outline-none resize-none font-[Poppins]"
                        />
                        <div>
                            <p className="text-[11px] text-gray-500 mb-1">Schedule for (leave blank for ASAP)</p>
                            <input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5 text-sm text-[#1e1b4b] outline-none font-[Poppins]"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-2 flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        Service address
                    </p>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House/flat no, street, landmark..."
                        rows={2}
                        className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5 text-sm text-[#1e1b4b] placeholder:text-gray-400 outline-none resize-none font-[Poppins] mb-3"
                    />

                    {selectedCoords ? (
                        <MapPicker 
                            defaultLocation={selectedCoords} 
                            onLocationSelect={(loc) => setSelectedCoords(loc)} 
                        />
                    ) : (
                        <div className="w-full h-[200px] bg-[#f8f7ff] border border-[#ede9fe] rounded-xl flex items-center justify-center">
                            <p className="text-[11px] text-gray-500">Detecting location...</p>
                        </div>
                    )}
                    
                    {!coords && (
                        <p className="text-[11px] text-orange-500 mt-1.5">
                            Waiting for GPS to enable distance calculation...
                        </p>
                    )}
                </div>

                {/* Payment method */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-3">Payment method</p>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handlePaymentSelect("cash")}
                            className={`flex items-center justify-between border rounded-[10px] px-3.5 py-3 text-sm font-medium transition-colors ${paymentMethod === "cash"
                                    ? "border-[#0f172a] bg-[#f8f7ff] text-[#1e1b4b]"
                                    : "border-[#ede9fe] text-gray-500"
                                }`}
                        >
                            <span>Cash on completion</span>
                            {paymentMethod === "cash" && <ShieldCheck size={16} className="text-[#0f172a]" />}
                        </button>

                        <button
                            onClick={() => handlePaymentSelect("upi")}
                            className="flex items-center justify-between border border-[#ede9fe] rounded-[10px] px-3.5 py-3 text-sm font-medium text-gray-500"
                        >
                            <span>UPI / Card</span>
                            <span className="text-[10px] bg-[#f8f7ff] text-gray-400 px-2 py-0.5 rounded-full">Coming soon</span>
                        </button>
                    </div>
                </div>

                {/* Booking token notice */}
                <div className="bg-[#f8f7ff] border border-[#ede9fe] rounded-2xl p-4 flex items-start gap-2.5">
                    <IndianRupee size={16} className="text-[#0f172a] mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-0.5">₹5 booking token</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Confirms your booking is genuine. Refunded if cancelled before the worker is dispatched.
                            A ₹49 cancellation charge applies after dispatch.
                        </p>
                    </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                {/* Confirm */}
                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3.5 disabled:opacity-60"
                >
                    {loading ? "Confirming..." : "Confirm Booking"}
                </button>
            </div>

            {/* UPI placeholder */}
            <ComingSoonModal
                open={showUpiModal}
                onClose={() => setShowUpiModal(false)}
                icon={<IndianRupee size={28} className="text-blue-500" />}
                title="Online Payment"
                message="UPI and card payments will be integrated in a future update. Cash on completion is available now."
            />

            {showPaymentGateway && (
                <MockPaymentGateway
                    amount={5}
                    onSuccess={processBooking}
                    onClose={() => setShowPaymentGateway(false)}
                />
            )}
        </PageWrapper>
    );
}