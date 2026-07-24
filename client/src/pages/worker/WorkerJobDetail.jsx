import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, ShieldCheck, IndianRupee, Timer, MessageCircle } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import BookingTimeline from "../../components/booking/BookingTimeline";
import OTPInput from "../../components/booking/OTPInput";
import PhotoProofSlot from "../../components/booking/PhotoProofSlot";
import { bookingService } from "../../services/bookingService";
import { useSocket } from "../../hooks/useSocket";
import { SERVICE_CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { reportService } from "../../services/reportService";

function getCategoryInfo(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: categoryId, emoji: "🔧" };
}

export default function WorkerJobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // OTP entry state
    const [arrivalOtpInput, setArrivalOtpInput] = useState("");
    const [completionOtpInput, setCompletionOtpInput] = useState("");
    const [verifying, setVerifying] = useState(false);

    // Photo upload state
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);

    // Price quote
    const [price, setPrice] = useState("");
    const [quoting, setQuoting] = useState(false);
    const [confirmingCash, setConfirmingCash] = useState(false);

    // Report
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportCategory, setReportCategory] = useState("Wasted Time");
    const [reportNote, setReportNote] = useState("");
    const [reporting, setReporting] = useState(false);

    // Phase 1: Spare Parts
    const [sparePartsOpen, setSparePartsOpen] = useState(false);
    const [spareCost, setSpareCost] = useState("");
    const [spareDesc, setSpareDesc] = useState("");
    const [requestingParts, setRequestingParts] = useState(false);

    // Phase 4: Gate arrival timer
    const [gateLoading, setGateLoading] = useState(false);
    const [gateError, setGateError] = useState("");
    const [gateSecondsLeft, setGateSecondsLeft] = useState(null); // null = no gate ping yet
    const [cancelling, setCancelling] = useState(false);
    const gateTimerRef = useRef(null);

    const status = booking?.status || "accepted";

    const { coords: workerCoords } = useGeolocation("watch");
    useEffect(() => {
        if (!socket || !workerCoords) return;

        const activeStatuses = ["accepted", "arrival_verified", "in_progress", "repair_verified", "payment_pending"];
        if (!activeStatuses.includes(status)) return;

        const interval = setInterval(() => {
            socket.emit("location:update", {
                bookingId: id,
                latitude: workerCoords.lat,
                longitude: workerCoords.lng,
            });
        }, 15000);

        // Send immediately on mount too
        socket.emit("location:update", { bookingId: id, latitude: workerCoords.lat, longitude: workerCoords.lng });

        return () => clearInterval(interval);
    }, [socket, workerCoords, status, id]);

    // Phase 4: Countdown timer driven by booking.workerArrivedAtGate
    useEffect(() => {
        if (!booking?.workerArrivedAtGate) return;
        const GATE_WAIT_MS = 10 * 60 * 1000; // 10 minutes

        const tick = () => {
            const elapsed = Date.now() - new Date(booking.workerArrivedAtGate).getTime();
            const remaining = Math.max(0, GATE_WAIT_MS - elapsed);
            setGateSecondsLeft(Math.ceil(remaining / 1000));
            if (remaining <= 0) clearInterval(gateTimerRef.current);
        };

        tick(); // immediate first tick
        gateTimerRef.current = setInterval(tick, 1000);
        return () => clearInterval(gateTimerRef.current);
    }, [booking?.workerArrivedAtGate]);

    useEffect(() => {
        const fetchBooking = async () => {
            setLoading(true);
            try {
                const data = await bookingService.getById(id);
                setBooking(data.booking || data);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load job.");
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    // Live status updates
    useEffect(() => {
        if (!socket) return;
        const joinRoom = () => socket.emit("booking:join", id);
        joinRoom(); // Join immediately on mount
        socket.on("connect", joinRoom); // Re-join if socket reconnects after server restart
        const handleStatusChange = (updated) => {
            setBooking((prev) => ({ ...prev, ...updated }));
        };
        socket.on("booking:statusChanged", handleStatusChange);
        return () => {
            socket.emit("booking:leave", id);
            socket.off("connect", joinRoom);
            socket.off("booking:statusChanged", handleStatusChange);
        };
    }, [socket, id]);

    const handleVerifyArrival = async () => {
        if (arrivalOtpInput.length !== 4) return;
        setVerifying(true);
        setError("");
        try {
            const data = await bookingService.verifyArrival(id, arrivalOtpInput);
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Incorrect OTP. Try again.");
        } finally {
            setVerifying(false);
        }
    };

    const handleUploadBefore = async (file) => {
        setUploadingBefore(true);
        setError("");
        try {
            const data = await bookingService.uploadBeforePhoto(id, file);
            setBooking((prev) => ({
                ...prev,
                ...(data.booking || data),
                beforePhotoUrl: URL.createObjectURL(file),
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not upload photo.");
        } finally {
            setUploadingBefore(false);
        }
    };

    const handleUploadAfter = async (file) => {
        setUploadingAfter(true);
        setError("");
        try {
            const data = await bookingService.uploadAfterPhoto(id, file);
            setBooking((prev) => ({
                ...prev,
                ...(data.booking || data),
                afterPhotoUrl: URL.createObjectURL(file),
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not upload photo. AI verification may have failed.");
        } finally {
            setUploadingAfter(false);
        }
    };

    const handleVerifyCompletion = async () => {
        if (completionOtpInput.length !== 4) return;
        setVerifying(true);
        setError("");
        try {
            const data = await bookingService.verifyCompletion(id, completionOtpInput);
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Incorrect OTP. Try again.");
        } finally {
            setVerifying(false);
        }
    };

    const [customerConfirmed, setCustomerConfirmed] = useState(false);

    const handleConfirmPrice = async () => {
        const amount = Number(price);
        if (!amount || amount <= 0 || !customerConfirmed) {
            setError("Enter a valid amount and confirm with customer.");
            return;
        }
        setQuoting(true);
        setError("");
        try {
            const data = await bookingService.confirmPrice(id, amount);
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not confirm price.");
        } finally {
            setQuoting(false);
        }
    };

    const handleQuotePrice = async () => {
        const extraCharge = Math.max(0, Number(price) || 0);
        setQuoting(true);
        setError("");
        try {
            const data = await bookingService.quotePrice(id, extraCharge);
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not submit quote.");
        } finally {
            setQuoting(false);
        }
    };

    const handlePriceDisagreementCancel = async () => {
        setQuoting(true);
        setError("");
        try {
            // we will need to pass cancellationReason in the cancel API. Let's do that soon.
            const data = await bookingService.cancel(id, "price_disagreement");
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not cancel booking.");
        } finally {
            setQuoting(false);
        }
    };

    const handleConfirmCash = async () => {
        setConfirmingCash(true);
        setError("");
        try {
            const data = await bookingService.confirmCash(id);
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not confirm payment.");
        } finally {
            setConfirmingCash(false);
        }
    };

    const handleReportCustomer = async () => {
        setReporting(true);
        try {
            await reportService.reportCustomer({ bookingId: id, category: reportCategory, note: reportNote });
            setReportModalOpen(false);
            alert("Customer reported successfully.");
        } catch (err) {
            alert(err.response?.data?.message || "Could not report customer.");
        } finally {
            setReporting(false);
        }
    };

    const handleRequestSpareParts = async () => {
        const cost = Number(spareCost);
        if (!cost || cost <= 0) {
            setError("Enter a valid spare parts cost.");
            return;
        }
        setRequestingParts(true);
        setError("");
        try {
            const data = await bookingService.requestSpareParts(id, {
                sparePartsCost: cost,
                sparePartsDescription: spareDesc,
            });
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
            setSparePartsOpen(false);
            setSpareCost("");
            setSpareDesc("");
        } catch (err) {
            setError(err.response?.data?.message || "Could not send spare parts request.");
        } finally {
            setRequestingParts(false);
        }
    };

    // Phase 4: Gate handlers
    const handleMarkAtGate = async () => {
        if (!workerCoords) {
            setGateError("Could not read your GPS location. Please enable location access.");
            return;
        }
        setGateLoading(true);
        setGateError("");
        try {
            const data = await bookingService.markAtGate(id, {
                latitude: workerCoords.lat,
                longitude: workerCoords.lng,
            });
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setGateError(err.response?.data?.message || "Could not mark arrival. Make sure you are within 100m.");
        } finally {
            setGateLoading(false);
        }
    };

    const handleCancelUnresponsive = async () => {
        setCancelling(true);
        setError("");
        try {
            const data = await bookingService.cancel(id, "customer_unresponsive");
            setBooking((prev) => ({ ...prev, ...(data.booking || data) }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not cancel booking.");
        } finally {
            setCancelling(false);
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

    if (!booking) {
        return (
            <PageWrapper>
                <div className="max-w-[480px] mx-auto text-center py-20">
                    <p className="text-sm text-gray-500 mb-4">{error || "Job not found."}</p>
                    <button onClick={() => navigate("/worker")} className="text-sm font-semibold text-[#0f172a]">
                        ← Back to dashboard
                    </button>
                </div>
            </PageWrapper>
        );
    }

    const categoryInfo = getCategoryInfo(booking.category);
    const customerName = booking.user?.name || "Customer";
    const beforePhotoUrl = booking.beforePhoto || booking.beforePhotoUrl;
    const afterPhotoUrl = booking.afterPhoto || booking.afterPhotoUrl;

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-[#1e1b4b] flex items-center gap-2">
                            <span>{categoryInfo.emoji}</span>
                            {categoryInfo.label} Job
                        </h1>
                        <p className="text-xs text-gray-500">Customer: {customerName}</p>
                    </div>
                </div>
                {booking && status !== "pending" && (
                    <button
                        onClick={() => navigate(`/chat/${booking._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f7ff] text-indigo-500 rounded-full text-xs font-semibold hover:bg-indigo-50 transition-colors border border-[#ede9fe]"
                    >
                        <MessageCircle size={14} />
                        Chat
                    </button>
                )}
            </div>

            <div className="max-w-[560px] mx-auto mt-6 flex flex-col gap-4">

                {/* Address */}
                {booking.address && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-start gap-2.5">
                        <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-[#1e1b4b]">{booking.address}</p>
                    </div>
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}

                {/* Step: Verify arrival OTP — with Phase 4 gate button */}
                {status === "accepted" && (() => {
                    const isWithin100m = workerCoords && booking.location &&
                        (() => {
                            const R = 6371000;
                            const lat1 = workerCoords.lat * Math.PI / 180;
                            const lat2 = booking.location.coordinates[1] * Math.PI / 180;
                            const dLat = lat2 - lat1;
                            const dLng = (booking.location.coordinates[0] - workerCoords.lng) * Math.PI / 180;
                            const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
                            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 100;
                        })();
                    const gateMarked = !!booking.workerArrivedAtGate;
                    const timerExpired = gateSecondsLeft === 0;

                    const mm = gateSecondsLeft != null ? String(Math.floor(gateSecondsLeft / 60)).padStart(2, "0") : "--";
                    const ss = gateSecondsLeft != null ? String(gateSecondsLeft % 60).padStart(2, "0") : "--";

                    return (
                        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
                            <p className="text-xs font-semibold text-[#1e1b4b] mb-1">Enter Arrival OTP</p>
                            <p className="text-xs text-gray-500 mb-4">Ask the customer for the 4-digit code shown on their screen.</p>
                            <OTPInput value={arrivalOtpInput} onChange={setArrivalOtpInput} />
                            <button
                                onClick={handleVerifyArrival}
                                disabled={arrivalOtpInput.length !== 4 || verifying}
                                className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 mt-4 disabled:opacity-50"
                            >
                                {verifying ? "Verifying..." : "Verify Arrival"}
                            </button>

                            {/* Phase 4: Gate Section */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                {!gateMarked && isWithin100m && (
                                    <>
                                        {gateError && <p className="text-xs text-red-500 mb-2">{gateError}</p>}
                                        <button
                                            onClick={handleMarkAtGate}
                                            disabled={gateLoading}
                                            className="w-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold rounded-[10px] py-2.5 flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors disabled:opacity-50"
                                        >
                                            <Timer size={14} />
                                            {gateLoading ? "Marking..." : "🔔 I'm at the Gate — Start 10-min Timer"}
                                        </button>
                                        <p className="text-[10px] text-gray-400 mt-1.5 text-center">Only available when you are within 100m of the customer.</p>
                                    </>
                                )}
                                {!gateMarked && !isWithin100m && (
                                    <p className="text-[11px] text-gray-400 text-center">
                                        📍 Move within 100m of the location to enable the gate timer.
                                    </p>
                                )}
                                {gateMarked && !timerExpired && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-[10px] p-3 text-center">
                                        <p className="text-xs font-bold text-orange-800 mb-1">Waiting at Gate</p>
                                        <div className="text-2xl font-mono font-bold text-orange-700">{mm}:{ss}</div>
                                        <p className="text-[10px] text-orange-500 mt-1">Cancel option appears when timer reaches 0:00</p>
                                    </div>
                                )}
                                {gateMarked && timerExpired && (
                                    <>
                                        <div className="bg-red-50 border border-red-200 rounded-[10px] p-3 text-center mb-2">
                                            <p className="text-xs font-bold text-red-800">10 Minutes Elapsed — Customer Unresponsive</p>
                                            <p className="text-[10px] text-red-600 mt-0.5">You may cancel without any penalty to your Trust Score.</p>
                                        </div>
                                        <button
                                            onClick={handleCancelUnresponsive}
                                            disabled={cancelling}
                                            className="w-full bg-red-600 text-white text-xs font-semibold rounded-[10px] py-2.5 disabled:opacity-50 hover:bg-red-700 transition-colors"
                                        >
                                            {cancelling ? "Cancelling..." : "Cancel — Customer Didn't Respond"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Step: Price Agreement */}
                {status === "arrival_verified" && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-1">Discuss and confirm price</p>
                        <p className="text-xs text-gray-500 mb-4">Enter the final agreed price for this job after inspecting the issue.</p>
                        <div className="flex items-center gap-2 mb-4 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5">
                            <IndianRupee size={16} className="text-gray-400" />
                            <input 
                                type="number" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full bg-transparent outline-none text-sm font-semibold text-[#1e1b4b]"
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                            <input type="checkbox" checked={customerConfirmed} onChange={(e) => setCustomerConfirmed(e.target.checked)} className="w-4 h-4 rounded text-[#0f172a] focus:ring-[#0f172a]" />
                            <span className="text-xs font-semibold text-[#1e1b4b]">Customer confirmed this price</span>
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleConfirmPrice}
                                disabled={!price || !customerConfirmed || quoting}
                                className="flex-1 bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-50"
                            >
                                {quoting ? "Confirming..." : "Confirm & Start Job"}
                            </button>
                            <button
                                onClick={handlePriceDisagreementCancel}
                                disabled={quoting}
                                className="bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-[10px] px-4 py-3 hover:bg-red-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase 1: Spare Parts — waiting state */}
                {status === "spare_parts_pending" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🔩</span>
                            <p className="text-xs font-bold text-amber-800">Waiting for Customer Approval</p>
                        </div>
                        <p className="text-xs text-amber-700 mb-1">
                            You requested <span className="font-bold">₹{booking.sparePartsCost}</span> for spare parts.
                        </p>
                        {booking.sparePartsDescription && (
                            <p className="text-[11px] text-amber-600 italic">&ldquo;{booking.sparePartsDescription}&rdquo;</p>
                        )}
                        <p className="text-[11px] text-amber-500 mt-2">Job will resume once the customer responds.</p>
                    </div>
                )}

                {/* Phase 1: Spare Parts — request form (only while in_progress) */}
                {status === "in_progress" && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                        {!sparePartsOpen ? (
                            <button
                                onClick={() => setSparePartsOpen(true)}
                                className="w-full text-xs font-semibold text-[#7c3aed] flex items-center justify-center gap-1.5 py-2 rounded-[10px] border border-[#ede9fe] bg-[#f8f7ff] hover:bg-[#ede9fe] transition-colors"
                            >
                                🔩 Add Spare Parts to Bill
                            </button>
                        ) : (
                            <div>
                                <p className="text-xs font-bold text-[#1e1b4b] mb-1">Request Spare Parts Approval</p>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    Customer must approve before you procure the parts. The cost will be added to the final bill.
                                </p>
                                <div className="flex items-center gap-2 mb-2.5 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5">
                                    <IndianRupee size={14} className="text-gray-400 flex-shrink-0" />
                                    <input
                                        type="number"
                                        placeholder="Parts cost (e.g. 250)"
                                        value={spareCost}
                                        onChange={(e) => setSpareCost(e.target.value)}
                                        className="w-full bg-transparent outline-none text-sm font-semibold text-[#1e1b4b] placeholder:text-gray-400"
                                    />
                                </div>
                                <textarea
                                    placeholder="What parts are needed and why? (optional)"
                                    value={spareDesc}
                                    onChange={(e) => setSpareDesc(e.target.value)}
                                    rows={2}
                                    className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3 py-2.5 text-xs text-[#1e1b4b] outline-none resize-none placeholder:text-gray-400 mb-3"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRequestSpareParts}
                                        disabled={requestingParts}
                                        className="flex-1 bg-[#7c3aed] text-white text-xs font-semibold rounded-[10px] py-2.5 disabled:opacity-50 hover:bg-[#6d28d9] transition-colors"
                                    >
                                        {requestingParts ? "Sending..." : "Send Approval Request"}
                                    </button>
                                    <button
                                        onClick={() => { setSparePartsOpen(false); setSpareCost(""); setSpareDesc(""); }}
                                        className="px-4 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Before/After photos */}
                {(status === "in_progress" || status === "repair_verified") && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-3">Photo Proof of Work</p>
                        <div className="flex gap-3">
                            <PhotoProofSlot
                                label="Before"
                                imageUrl={beforePhotoUrl}
                                uploading={uploadingBefore}
                                onUpload={handleUploadBefore}
                                disabled={status === "repair_verified"}
                            />
                            <PhotoProofSlot
                                label="After"
                                imageUrl={afterPhotoUrl}
                                uploading={uploadingAfter}
                                onUpload={handleUploadAfter}
                                disabled={!beforePhotoUrl || status === "repair_verified"}
                            />
                        </div>
                        {status === "repair_verified" && (
                            <p className="text-[11px] text-green-600 mt-2.5 flex items-center gap-1">
                                <ShieldCheck size={12} /> AI verified — enter completion OTP below
                            </p>
                        )}
                    </div>
                )}

                {/* Step: Verify completion OTP — both normal and manual override paths */}
                {(status === "repair_verified" || status === "manual_verification_needed") && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
                        {status === "manual_verification_needed" && (
                            <div className="bg-orange-50 border border-orange-200 rounded-[10px] p-3 mb-4">
                                <p className="text-xs font-bold text-orange-800 mb-1">⚠️ AI Verification Inconclusive</p>
                                <p className="text-[11px] text-orange-700">
                                    Our AI couldn't automatically detect the repair — this can happen with invisible fixes (electrical rewiring, pipe sealing) or poor lighting. <span className="font-semibold">The customer has still received a Completion OTP.</span> Ask them to share it to confirm the work is done.
                                </p>
                            </div>
                        )}
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-1">Enter Completion OTP</p>
                        <p className="text-xs text-gray-500 mb-4">Ask the customer for the code shown on their screen.</p>
                        <OTPInput value={completionOtpInput} onChange={setCompletionOtpInput} />
                        <button
                            onClick={handleVerifyCompletion}
                            disabled={completionOtpInput.length !== 4 || verifying}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 mt-4 disabled:opacity-50"
                        >
                            {verifying ? "Verifying..." : "Verify Completion"}
                        </button>
                    </div>
                )}

                {/* Step: Quote price */}
                {status === "payment_pending" && !booking.workerCharge && (() => {
                    const agreedPrice = booking.agreedPrice || 0;
                    const spareParts = booking.sparePartsApproved ? (booking.sparePartsCost || 0) : 0;
                    const baseTotal = agreedPrice + spareParts;
                    const extraCharge = Number(price) || 0;
                    const finalTotal = baseTotal + extraCharge;

                    return (
                        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
                            <p className="text-xs font-semibold text-[#1e1b4b] mb-4">Finalize Price</p>

                            {/* Price breakdown */}
                            <div className="bg-[#f8f7ff] rounded-[10px] p-3.5 mb-4 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Agreed Price</span>
                                    <span className="font-semibold text-[#1e1b4b]">₹{agreedPrice}</span>
                                </div>
                                {spareParts > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Spare Parts</span>
                                        <span className="font-semibold text-[#1e1b4b]">₹{spareParts}</span>
                                    </div>
                                )}
                                {extraCharge > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Extra Charges</span>
                                        <span className="font-semibold text-[#1e1b4b]">₹{extraCharge}</span>
                                    </div>
                                )}
                                <div className="border-t border-[#ede9fe] mt-1 pt-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#1e1b4b]">Total</span>
                                    <span className="text-base font-bold text-[#7c3aed]">₹{finalTotal}</span>
                                </div>
                            </div>

                            {/* Optional extra charges */}
                            <p className="text-xs text-gray-400 mb-2">Any additional charges? (optional)</p>
                            <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                                <IndianRupee size={16} className="text-gray-400" />
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                                />
                            </div>
                            <button
                                onClick={handleQuotePrice}
                                disabled={quoting}
                                className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-50"
                            >
                                {quoting ? "Submitting..." : `Submit Final Quote — ₹${finalTotal}`}
                            </button>
                        </div>
                    );
                })()}

                {/* Step: Waiting for / confirm cash payment */}
                {status === "payment_pending" && booking.workerCharge && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-5 text-center">
                        <p className="text-xs text-gray-500 mb-1">Quoted Amount</p>
                        <p className="text-2xl font-bold text-[#1e1b4b] mb-4">₹{booking.workerCharge}</p>
                        <button
                            onClick={handleConfirmCash}
                            disabled={confirmingCash}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-50"
                        >
                            {confirmingCash ? "Confirming..." : "Confirm Cash Received"}
                        </button>
                        <p className="text-[11px] text-gray-400 mt-2">
                            Tap once the customer pays in cash. Online payment confirms automatically.
                        </p>
                    </div>
                )}

                {/* Done */}
                {(status === "payment_completed" || status === "review_submitted") && (
                    <div className="bg-white border border-green-200 bg-green-50 rounded-2xl p-5 text-center">
                        <ShieldCheck size={28} className="text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[#1e1b4b]">Job Completed</p>
                        <p className="text-xs text-gray-500 mt-1">Payment received ₹{booking.workerCharge}</p>
                    </div>
                )}

                {/* Timeline */}
                <BookingTimeline currentStatus={status} />

                {/* Report Customer */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <button 
                        onClick={() => setReportModalOpen(true)}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 underline"
                    >
                        Report this customer
                    </button>
                </div>
            </div>

            {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-[400px]">
                        <h2 className="text-sm font-bold text-[#1e1b4b] mb-4">Report Customer</h2>
                        <div className="mb-3">
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Reason</label>
                            <select 
                                value={reportCategory}
                                onChange={(e) => setReportCategory(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-[#f8f7ff] outline-none"
                            >
                                <option value="Wasted Time">Wasted Time</option>
                                <option value="Wrong Address">Wrong Address</option>
                                <option value="Abusive Behavior">Abusive Behavior</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Additional Details (Optional)</label>
                            <textarea
                                value={reportNote}
                                onChange={(e) => setReportNote(e.target.value)}
                                placeholder="Describe what happened..."
                                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-[#f8f7ff] outline-none min-h-[80px] resize-none"
                            ></textarea>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setReportModalOpen(false)}
                                className="flex-1 border border-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReportCustomer}
                                disabled={reporting}
                                className="flex-1 bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50"
                            >
                                {reporting ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}