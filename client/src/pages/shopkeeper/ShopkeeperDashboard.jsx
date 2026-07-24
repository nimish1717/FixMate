import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle, Plus, Star } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { shopkeeperService } from "../../services/shopkeeperService";
import { SERVICE_CATEGORIES, AVATAR_COLORS } from "../../utils/constants";

import { reportService } from "../../services/reportService";
import { inquiryService } from "../../services/inquiryService";

function getCategoryInfo(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: categoryId, emoji: "🔧" };
}

export default function ShopkeeperDashboard() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [reports, setReports] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [profileData, workersData, reportsData, inquiriesData] = await Promise.all([
                    shopkeeperService.getProfile(),
                    shopkeeperService.getMyWorkers(),
                    reportService.getReports().catch(() => ({ reports: [] })),
                    inquiryService.getInquiries().catch(() => ({ inquiries: [] }))
                ]);
                setProfile(profileData.shopkeeper || profileData);
                setWorkers(workersData.workers || workersData || []);
                setReports(reportsData.reports || []);
                setInquiries(inquiriesData.inquiries || []);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load dashboard.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isVerified = profile?.verificationStatus === "verified" || profile?.isVerified;

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div>
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">
                        {profile?.shopName || "Shop Dashboard"}
                    </h1>
                    <p className="text-xs text-gray-500">{workers.length} registered workers</p>
                </div>
                <button
                    onClick={() => navigate("/shopkeeper/workers/new")}
                    className="flex items-center gap-1.5 bg-[#0f172a] text-white text-xs font-semibold px-4 py-2.5 rounded-[10px]"
                >
                    <Plus size={14} />
                    Register Worker
                </button>
            </div>

            <div className="max-w-[640px] mx-auto mt-6 flex flex-col gap-4">

                {/* Verification status banner */}
                {!loading && profile && (
                    <div
                        className={`rounded-2xl p-4 flex items-center gap-3 border ${isVerified ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
                            }`}
                    >
                        {isVerified ? (
                            <ShieldCheck size={20} className="text-green-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle size={20} className="text-orange-600 flex-shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-semibold text-[#1e1b4b]">
                                {isVerified ? "Shop Verified" : "Verification Pending"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {isVerified
                                    ? "Your shop is verified. Workers you register can go live."
                                    : "Submit your GST/business proof to get verified and start registering workers."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Active Reports Banner */}
                {!loading && reports.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3 mb-2">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                            <AlertCircle size={18} />
                            Active Worker Reports ({reports.length})
                        </div>
                        <div className="flex flex-col gap-2">
                            {reports.map(report => (
                                <div key={report._id} className="bg-white rounded-xl p-3 shadow-sm border border-red-100 text-xs">
                                    <p className="font-semibold text-[#1e1b4b] mb-1">
                                        Worker: {report.worker?.user?.name || "Unknown"}
                                    </p>
                                    <p className="text-red-600 font-semibold">{report.category}</p>
                                    {report.note && <p className="text-gray-600 mt-1 italic">"{report.note}"</p>}
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        Reported by {report.reporter?.name || "Customer"} on {new Date(report.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Inquiries */}
                {!loading && inquiries.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col gap-3 mb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                <MessageSquare size={18} />
                                Parts Inquiries ({inquiries.length})
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {inquiries.map(inquiry => (
                                <button 
                                    key={inquiry._id} 
                                    onClick={() => navigate(`/chat/inquiry/${inquiry._id}`)}
                                    className="bg-white rounded-xl p-3 shadow-sm border border-indigo-100 flex items-center justify-between hover:border-indigo-300 text-left transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold text-[#1e1b4b] text-sm">
                                            {inquiry.user?.name || "Customer"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">Looking for spare parts...</p>
                                    </div>
                                    <div className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
                                        Reply
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col gap-2.5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[80px] animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Workers list */}
                {!loading && (
                    <div>
                        <p className="text-xs font-semibold text-[#1e1b4b] mb-2.5">Your Workers</p>

                        {workers.length === 0 ? (
                            <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center">
                                <div className="w-14 h-14 bg-[#f8f7ff] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                                    👷
                                </div>
                                <p className="text-sm font-semibold text-[#1e1b4b] mb-1">No workers yet</p>
                                <p className="text-xs text-gray-500 mb-4">
                                    Register a worker you personally know and trust to get started.
                                </p>
                                <button
                                    onClick={() => navigate("/shopkeeper/workers/new")}
                                    className="text-xs font-semibold text-[#0f172a]"
                                >
                                    + Register your first worker
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {workers.map((worker, i) => {
                                    const avatar = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                    const cat = getCategoryInfo(worker.category);
                                    const name = worker.user?.name || worker.name || "Worker";
                                    const initial = name.charAt(0).toUpperCase();

                                    return (
                                        <button
                                            key={worker._id}
                                            onClick={() => navigate(`/shopkeeper/workers/${worker._id}`)}
                                            className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex flex-col gap-3 text-left hover:border-[#0f172a] transition-colors"
                                        >
                                            {/* Top Row: Info */}
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatar.bg} ${avatar.text}`}>
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-[#1e1b4b] flex items-center gap-2">
                                                            {name}
                                                            {!worker.isActive && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                            {cat.emoji} {cat.label} · {worker.experience || 0} yrs exp
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${worker.status === "online"
                                                            ? "bg-green-100 text-green-700"
                                                            : worker.status === "busy"
                                                                ? "bg-orange-100 text-orange-700"
                                                                : "bg-gray-100 text-gray-500"
                                                            }`}
                                                    >
                                                        {worker.status}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm font-bold text-[#1e1b4b]">
                                                            {worker.trustScore ?? worker.rating?.toFixed(1) ?? "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Row: Metrics */}
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <div className="bg-[#f8f7ff] rounded-xl px-3 py-2 flex items-center justify-between">
                                                    <span className="text-[11px] text-gray-500 font-medium">Jobs this month</span>
                                                    <span className="text-xs font-bold text-[#1e1b4b]">{worker.jobsThisMonth || 0}</span>
                                                </div>
                                                <div className="bg-[#fff0f0] rounded-xl px-3 py-2 flex items-center justify-between">
                                                    <span className="text-[11px] text-red-500 font-medium">Warranty Claims</span>
                                                    <span className="text-xs font-bold text-red-600">{worker.warrantyClaims || 0}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}