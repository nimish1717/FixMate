import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, MessageSquare, MapPin, BadgeCheck, IndianRupee } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import BookingTimeline from "../../components/booking/BookingTimeline";
import OTPDisplay from "../../components/booking/OTPDisplay";
import PhotoProofSlot from "../../components/booking/PhotoProofSlot";
import { bookingService } from "../../services/bookingService";
import { useSocket } from "../../hooks/useSocket";
import ComingSoonModal from "../../components/ui/ComingSoonModal";
import LiveTrackingMap from "../../components/booking/LiveTrackingMap";
import { useGeolocation } from "../../hooks/useGeolocation";
import { SERVICE_CATEGORIES } from "../../utils/constants";

function getCategoryInfo(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: categoryId, emoji: "🔧" };
}

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [arrivalOtp, setArrivalOtp] = useState(null);
    const [completionOtp, setCompletionOtp] = useState(null);
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    // Phase 1: Spare Parts response state
    const [respondingToParts, setRespondingToParts] = useState(false);

    // Phase 3: Payment state
    const [paying, setPaying] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState("");

    const { coords: customerCoords } = useGeolocation();
    const [workerLocation, setWorkerLocation] = useState(null);
    const [showMap, setShowMap] = useState(false);

    // Initial fetch
    useEffect(() => {
        const fetchBooking = async () => {
            setLoading(true);
            try {
                const [bookingRes, otpsRes] = await Promise.all([
                    bookingService.getById(id),
                    bookingService.getOtps(id).catch(() => ({ otps: [] })) // catch if none exist
                ]);

                const bookingData = bookingRes.booking || bookingRes;
                setBooking(bookingData);

                const otps = otpsRes.otps || [];
                const arrivalDoc = otps.find(o => o.type === "arrival");
                const completionDoc = otps.find(o => o.type === "completion");

                if (arrivalDoc && !arrivalDoc.verified) setArrivalOtp(arrivalDoc.otp);
                if (completionDoc && !completionDoc.verified) setCompletionOtp(completionDoc.otp);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load booking.");
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    // Socket: join room, listen for live updates
    useEffect(() => {
        if (!socket) return;

        const joinRoom = () => socket.emit("booking:join", id);
        joinRoom(); // Join immediately on mount
        socket.on("connect", joinRoom); // Re-join if socket reconnects after server restart

        const handleStatusChange = (updatedBooking) => {
            setBooking((prev) => ({ ...prev, ...updatedBooking }));
        };

        const handleOtpGenerated = ({ type, otp }) => {
            if (type === "arrival") setArrivalOtp(otp);
            if (type === "completion") setCompletionOtp(otp);
        };

        const handleLocationUpdate = ({ latitude, longitude }) => {
            setWorkerLocation({ lat: latitude, lng: longitude });
        };

        socket.on("booking:statusChanged", handleStatusChange);
        socket.on("booking:otpGenerated", handleOtpGenerated);
        socket.on("location:update", handleLocationUpdate);

        return () => {
            socket.emit("booking:leave", id);
            socket.off("connect", joinRoom);
            socket.off("booking:statusChanged", handleStatusChange);
            socket.off("booking:otpGenerated", handleOtpGenerated);
            socket.off("location:update", handleLocationUpdate);
        };
    }, [socket, id]);

    const handleUploadBefore = async (file) => {
        setUploadingBefore(true);
        try {
            const data = await bookingService.uploadBeforePhoto(id, file);
            setBooking((prev) => ({ ...prev, ...(data.booking || data), beforePhotoUrl: URL.createObjectURL(file) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not upload before photo.");
        } finally {
            setUploadingBefore(false);
        }
    };

    const handleUploadAfter = async (file) => {
        setUploadingAfter(true);
        try {
            const data = await bookingService.uploadAfterPhoto(id, file);
            setBooking((prev) => ({ ...prev, ...(data.booking || data), afterPhotoUrl: URL.createObjectURL(file) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not upload after photo.");
        } finally {
            setUploadingAfter(false);
        }
    };

    const handleRespondToSpareParts = async (approved) => {
        setRespondingToParts(true);
        setError("");
        try {
            const data = await bookingService.respondToSpareParts(id, approved);
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not respond to spare parts request.");
        } finally {
            setRespondingToParts(false);
        }
    };

    // Phase 3: Pay for booking
    const handlePay = async (method) => {
        if (!method) return;
        setPaying(true);
        setError("");
        try {
            const data = await bookingService.pay(id, { paymentMethod: method });
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Payment failed. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <div className="max-w-[560px] mx-auto mt-10 flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[100px] animate-pulse" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (error || !booking) {
        return (
            <PageWrapper>
                <div className="max-w-[480px] mx-auto text-center py-20">
                    <p className="text-sm text-gray-500 mb-4">{error || "Booking not found."}</p>
                    <button onClick={() => navigate("/")} className="text-sm font-semibold text-[#0f172a]">
                        ← Go back home
                    </button>
                </div>
            </PageWrapper>
        );
    }

    const categoryInfo = getCategoryInfo(booking.category);
    const workerName = booking.worker?.user?.name || "Worker";
    const shopName = booking.worker?.shopkeeper?.shopName;
    const status = booking.status || "pending";

    // Photos may come back as URLs from backend, or local preview URLs we set after upload
    const beforePhotoUrl = booking.beforePhoto || booking.beforePhotoUrl;
    const afterPhotoUrl = booking.afterPhoto || booking.afterPhotoUrl;

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-[#1e1b4b] flex items-center gap-2">
                        <span>{categoryInfo.emoji}</span>
                        {categoryInfo.label} Booking
                    </h1>
                    <p className="text-xs text-gray-500">Booking #{booking._id?.slice(-6) || id.slice(-6)}</p>
                </div>
            </div>

            <div className="max-w-[560px] mx-auto mt-6 flex flex-col gap-4">

                {/* Worker card */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[10px] bg-blue-100 text-blue-800 flex items-center justify-center text-base font-bold flex-shrink-0">
                            {workerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-[#1e1b4b]">{workerName}</span>
                                {booking.worker?.isVerified && <ShieldCheck size={14} className="text-green-500" />}
                            </div>
                            {shopName && <p className="text-[11px] text-gray-500">via {shopName}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMap((prev) => !prev)}
                            className="w-9 h-9 rounded-full bg-[#f8f7ff] flex items-center justify-center text-gray-500"
                        >
                            <MapPin size={15} />
                        </button>
                        <button
                            onClick={() => navigate(`/chat/${booking._id}`)}
                            className="w-9 h-9 rounded-full bg-[#f8f7ff] flex items-center justify-center text-gray-500"
                        >
                            <MessageSquare size={15} />
                        </button>
                    </div>
                </div>

                {/* Live Tracking Map */}
                {showMap && (
                    <LiveTrackingMap
                        customerLocation={customerCoords}
                        workerLocation={workerLocation}
                        workerName={workerName}
                    />
                )}

                {/* Phase 1: Spare Parts Approval Card */}
                {status === "spare_parts_pending" && (
                    <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🔩</span>
                            <p className="text-sm font-bold text-[#1e1b4b]">Spare Parts Approval Required</p>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                            Your worker needs spare parts costing{" "}
                            <span className="font-bold text-[#1e1b4b]">₹{booking.sparePartsCost}</span> to complete the repair.
                        </p>
                        {booking.sparePartsDescription && (
                            <div className="bg-amber-50 border border-amber-100 rounded-[10px] px-3 py-2 mb-3">
                                <p className="text-[11px] text-amber-800 italic">&ldquo;{booking.sparePartsDescription}&rdquo;</p>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-500 mb-3">
                            ⚠️ Approving will add <span className="font-semibold">₹{booking.sparePartsCost}</span> to your final bill.
                        </p>
                        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRespondToSpareParts(true)}
                                disabled={respondingToParts}
                                className="flex-1 bg-green-600 text-white text-xs font-semibold rounded-[10px] py-3 disabled:opacity-50 hover:bg-green-700 transition-colors"
                            >
                                {respondingToParts ? "Saving..." : "✅ Approve"}
                            </button>
                            <button
                                onClick={() => handleRespondToSpareParts(false)}
                                disabled={respondingToParts}
                                className="flex-1 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-[10px] py-3 disabled:opacity-50 hover:bg-red-100 transition-colors"
                            >
                                {respondingToParts ? "Saving..." : "❌ Reject"}
                            </button>
                        </div>
                    </div>
                )}

                {/* OTP displays — only shown when relevant to current status */}
                {arrivalOtp && status === "accepted" && (
                    <OTPDisplay otp={arrivalOtp} type="arrival" />
                )}
                {completionOtp && status === "repair_verified" && (
                    <OTPDisplay otp={completionOtp} type="completion" />
                )}

                {/* Phase 2: Manual verification — customer sees OTP with context */}
                {completionOtp && status === "manual_verification_needed" && (
                    <div className="bg-white border-2 border-orange-300 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs font-bold text-orange-800 mb-1">⚠️ Manual Verification Required</p>
                        <p className="text-[11px] text-gray-600 mb-3">
                            Our AI system couldn't automatically confirm the repair. <span className="font-semibold">You are in control</span> — share the code below with the worker only if you are satisfied with the repair.
                        </p>
                        <OTPDisplay otp={completionOtp} type="completion" />
                    </div>
                )}

                {/* Photo proof — visible once worker has arrived */}
                {(status === "arrival_verified" || status === "in_progress" || status === "repair_verified" || status === "payment_pending") && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-3">Photo Proof of Work</p>
                        <div className="flex gap-3">
                            <PhotoProofSlot
                                label="Before"
                                imageUrl={beforePhotoUrl}
                                readOnly={true}
                            />
                            <PhotoProofSlot
                                label="After"
                                imageUrl={afterPhotoUrl}
                                readOnly={true}
                            />
                        </div>
                        {afterPhotoUrl && status === "repair_verified" && (
                            <p className="text-[11px] text-green-600 mt-2.5 flex items-center gap-1">
                                <ShieldCheck size={12} /> AI verified — completion OTP ready
                            </p>
                        )}
                    </div>
                )}

                {/* Timeline */}
                <BookingTimeline currentStatus={status} />

                {/* Price Breakdown (shown before payment_pending but after price is agreed) */}
                {(status === "in_progress" || status === "repair_verified") && booking.agreedPrice && (
                    <div className="bg-[#f8f7ff] border border-[#ede9fe] rounded-2xl p-4">
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-3">Estimated Price Breakdown</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Agreed Price</span>
                                <span className="font-semibold text-[#1e1b4b]">₹{booking.agreedPrice}</span>
                            </div>
                            {booking.sparePartsApproved && booking.sparePartsCost > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Spare Parts</span>
                                    <span className="font-semibold text-[#1e1b4b]">₹{booking.sparePartsCost}</span>
                                </div>
                            )}
                            <div className="border-t border-[#ede9fe] mt-1 pt-2 flex justify-between items-center">
                                <span className="text-xs font-bold text-[#1e1b4b]">Estimated Total</span>
                                <span className="text-sm font-bold text-[#7c3aed]">
                                    ₹{booking.agreedPrice + (booking.sparePartsApproved ? (booking.sparePartsCost || 0) : 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 3: Warranty Banner — shown at payment_pending to incentivize online payment */}
                {status === "payment_pending" && (
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <BadgeCheck size={18} className="text-indigo-600 flex-shrink-0" />
                                <p className="text-sm font-bold text-indigo-900">Payment Due</p>
                            </div>
                            {booking.workerCharge && (
                                <p className="text-lg font-bold text-[#1e1b4b]">₹{booking.workerCharge}</p>
                            )}
                        </div>
                        <p className="text-[11px] text-indigo-700 mb-4">
                            Pay securely via FixMate (UPI, Card, or Wallet) to activate your free <span className="font-semibold">30-Day Repair Guarantee</span>. If the same issue reoccurs, we'll send a worker at no extra charge.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handlePay("upi")}
                                disabled={paying}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-[10px] py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                <BadgeCheck size={15} />
                                {paying ? "Processing..." : "Pay via UPI / Card — Get Warranty"}
                            </button>
                            <button
                                onClick={() => handlePay("cash")}
                                disabled={paying}
                                className="w-full bg-white border border-gray-200 text-gray-500 text-xs font-semibold rounded-[10px] py-2.5 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                Pay in Cash (no warranty)
                            </button>
                        </div>
                        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                    </div>
                )}

                {/* Phase 3: Warranty Badge — shown after online payment */}
                {status === "payment_completed" && booking.hasPlatformWarranty && (
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 flex items-center gap-3 shadow-md">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <BadgeCheck size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">30-Day Repair Warranty Active</p>
                            <p className="text-[11px] text-white/80 mt-0.5">If this issue recurs within 30 days, we cover the revisit at no extra cost.</p>
                        </div>
                    </div>
                )}

                {/* Review CTA — shown when payment completed and review not yet submitted */}
                {(status === "payment_completed") && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-5 text-center">
                        <ShieldCheck size={28} className="text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[#1e1b4b] mb-1">Job Completed!</p>
                        <p className="text-xs text-gray-500 mb-4">Share your experience to help other customers</p>
                        <button
                            onClick={() => navigate(`/bookings/${booking._id}/review`)}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3.5"
                        >
                            ⭐ Leave a Review
                        </button>
                    </div>
                )}

                {/* Job fully done after review */}
                {status === "review_submitted" && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                        <ShieldCheck size={28} className="text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[#1e1b4b]">All Done! Thank you 🎉</p>
                        <p className="text-xs text-gray-500 mt-1">Your review has been submitted successfully.</p>
                    </div>
                )}
            </div>

            {/* Report Button */}
            <div className="mt-8 mb-6 flex justify-center">
                <button
                    onClick={() => navigate(`/bookings/${booking._id}/report`)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                    Report an issue with this worker
                </button>
            </div>

            {/* Placeholders */}
            <ComingSoonModal
                open={showCallModal}
                onClose={() => setShowCallModal(false)}
                icon={<MessageSquare size={28} className="text-blue-500" />}
                title="In-app calling"
                message="Masked calling will be integrated in a future update. Use chat for now."
            />
        </PageWrapper>
    );
}