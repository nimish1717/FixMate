import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Power, Briefcase, Wallet, CalendarDays } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { bookingService } from "../../services/bookingService";
import { useSocket } from "../../hooks/useSocket";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useWorkerStore } from "../../store/workerStore";
import { useToastStore } from "../../store/toastStore";
import { SERVICE_CATEGORIES } from "../../utils/constants";

function getCategoryInfo(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: categoryId, emoji: "🔧" };
}

export default function WorkerDashboard() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { coords } = useGeolocation();
    const { isOnline, toggleOnline } = useWorkerStore();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [accepting, setAccepting] = useState(null); // booking id currently being accepted

    const [pendingFees, setPendingFees] = useState(0);

    const showToast = useToastStore((state) => state.showToast);
    const [profile, setProfile] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(false);

    // Initial fetch
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const workerServiceModule = await import("../../services/workerService");
                const workerService = workerServiceModule.workerService;
                
                const [jobsData, feesData, profileData] = await Promise.all([
                    bookingService.getWorkerBookings(),
                    workerService.getPendingFees().catch(() => ({ totalUnpaidFees: 0 })),
                    workerService.getProfile().catch(() => ({ worker: null }))
                ]);
                setJobs(jobsData.bookings || jobsData || []);
                setPendingFees(feesData.totalUnpaidFees || 0);
                if (profileData.worker) {
                    setProfile(profileData.worker);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Could not load data.");
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    // Heartbeat: keeps worker online while dashboard is open and they are marked as isOnline
    useEffect(() => {
        if (!isOnline) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                const workerServiceModule = await import("../../services/workerService");
                await workerServiceModule.workerService.sendHeartbeat();
            } catch (err) {
                console.error("Heartbeat failed", err);
            }
        }, 5 * 60 * 1000); // every 5 minutes

        return () => clearInterval(heartbeatInterval);
    }, [isOnline]);

    // Live: new booking requests pushed to this worker
    useEffect(() => {
        if (!socket) return;
        const handleNewBooking = (booking) => {
            setJobs((prev) => [booking, ...prev]);
        };
        socket.on("booking:created", handleNewBooking);
        return () => socket.off("booking:created", handleNewBooking);
    }, [socket]);

    const handleAccept = async (bookingId) => {
        setAccepting(bookingId);
        try {
            await bookingService.accept(bookingId);
            navigate(`/worker/jobs/${bookingId}`);
        } catch (err) {
            setError(err.response?.data?.message || "Could not accept job.");
            setAccepting(null);
        }
    };

    const handleAcceptRequest = async () => {
        setProcessingRequest(true);
        try {
            const workerService = (await import("../../services/workerService")).workerService;
            await workerService.acceptVerification();
            showToast("You are now verified!", "success");
            setProfile(prev => ({ ...prev, pendingShopkeeperRequest: null, isVerified: true }));
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to accept request", "error");
        } finally {
            setProcessingRequest(false);
        }
    };

    const handleRejectRequest = async () => {
        setProcessingRequest(true);
        try {
            const workerService = (await import("../../services/workerService")).workerService;
            await workerService.rejectVerification();
            showToast("Request rejected.", "info");
            setProfile(prev => ({ ...prev, pendingShopkeeperRequest: null }));
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to reject request", "error");
        } finally {
            setProcessingRequest(false);
        }
    };

    // Split jobs: pending (need accept) vs active (already accepted, in progress)
    const pendingJobs = jobs.filter((j) => j.status === "pending");
    const activeJobs = jobs.filter((j) => j.status && j.status !== "pending" && j.status !== "payment_completed" && j.status !== "review_submitted" && j.status !== "cancelled");

    return (
        <PageWrapper>
            {/* Header with online toggle */}
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-lg font-semibold text-[#1e1b4b]">Job Requests</h1>
                <button
                    onClick={() => toggleOnline(coords)}
                    className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${isOnline
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-gray-50 border-gray-200 text-gray-500"
                        }`}
                >
                    <Power size={14} />
                    {isOnline ? "Online" : "Offline"}
                </button>
            </div>

            <div className="max-w-[560px] mx-auto mt-6 flex flex-col gap-5">

                {!isOnline && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-500">You're offline. Go online to receive job requests.</p>
                    </div>
                )}

                {profile?.pendingShopkeeperRequest && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex flex-col gap-3">
                        <div>
                            <p className="text-sm font-bold text-yellow-800">Verification Request</p>
                            <p className="text-xs text-yellow-700 mt-1">
                                <strong>{profile.pendingShopkeeperRequest.shopName}</strong> wants to verify you and add you to their shop. 
                                By accepting, you agree to route payments through them.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAcceptRequest}
                                disabled={processingRequest}
                                className="flex-1 bg-yellow-600 text-white text-xs font-semibold py-2.5 rounded-[10px] disabled:opacity-50"
                            >
                                Accept
                            </button>
                            <button
                                onClick={handleRejectRequest}
                                disabled={processingRequest}
                                className="flex-1 bg-white text-yellow-800 border border-yellow-300 text-xs font-semibold py-2.5 rounded-[10px] disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                {pendingFees > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Wallet size={16} className="text-red-600" />
                            <p className="text-sm font-semibold text-red-800">Platform Fees Due: ₹{pendingFees}</p>
                        </div>
                        <p className="text-xs text-red-600">Please pay your pending platform fees to continue receiving jobs.</p>
                        <button className="self-start text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-[8px] mt-1 hover:bg-red-700 transition-colors">
                            Pay Now
                        </button>
                    </div>
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col gap-2.5">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[90px] animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Active jobs */}
                {!loading && activeJobs.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-2.5 flex items-center gap-1.5">
                            <Briefcase size={14} /> Active Job
                        </p>
                        <div className="flex flex-col gap-2.5">
                            {activeJobs.map((job) => {
                                const cat = getCategoryInfo(job.category);
                                return (
                                    <button
                                        key={job._id}
                                        onClick={() => navigate(`/worker/jobs/${job._id}`)}
                                        className="w-full bg-white border border-[#0f172a] rounded-2xl p-4 flex items-center justify-between text-left"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-[#1e1b4b]">
                                                {cat.emoji} {cat.label}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                                                {job.user?.name || "Customer"} 
                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">⭐ {job.user?.trustScore ?? 100}</span>
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-semibold bg-[#f8f7ff] text-[#0f172a] px-3 py-1 rounded-full">
                                            {job.status}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pending requests */}
                {isOnline && !loading && (
                    <div>
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-2.5">New Requests</p>
                        {pendingJobs.length === 0 ? (
                            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 text-center">
                                <p className="text-sm text-gray-500">No new requests right now.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {pendingJobs.map((job) => {
                                    const cat = getCategoryInfo(job.category);
                                    return (
                                        <div key={job._id} className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1e1b4b]">
                                                        {cat.emoji} {cat.label}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {job.address || "Address not provided"}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[11px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                                        ⭐ {job.user?.trustScore ?? 100} Trust
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-1">Customer</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAccept(job._id)}
                                                disabled={accepting === job._id}
                                                className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-2.5 disabled:opacity-60"
                                            >
                                                {accepting === job._id ? "Accepting..." : "Accept Job"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Earnings & History shortcuts */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate("/worker/earnings")}
                        className="flex-1 bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-center justify-between"
                    >
                        <span className="text-sm font-semibold text-[#1e1b4b] flex items-center gap-2">
                            <Wallet size={16} className="text-gray-400" />
                            View Earnings
                        </span>
                        <span className="text-gray-300">→</span>
                    </button>
                    
                    <button
                        onClick={() => navigate("/worker/history")}
                        className="flex-1 bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-center justify-between"
                    >
                        <span className="text-sm font-semibold text-[#1e1b4b] flex items-center gap-2">
                            <CalendarDays size={16} className="text-gray-400" />
                            Job History
                        </span>
                        <span className="text-gray-300">→</span>
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
}