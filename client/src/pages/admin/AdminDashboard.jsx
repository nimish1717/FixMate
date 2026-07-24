import { useEffect, useState } from "react";
import { Users, Briefcase, IndianRupee, Star, Brain, Store } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { adminService } from "../../services/adminService";
import { reportService } from "../../services/reportService";
import { SERVICE_CATEGORIES } from "../../utils/constants";
import { useToastStore } from "../../store/toastStore";

function getCategoryInfo(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId) || { label: categoryId, emoji: "🔧" };
}

// One metric card. value can be a number, string, or "—" if missing.
function StatCard({ icon: Icon, label, value, sublabel }) {
    return (
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{label}</span>
                <Icon size={16} className="text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-[#1e1b4b]">{value ?? "—"}</p>
            {sublabel && <p className="text-[11px] text-gray-400 mt-1">{sublabel}</p>}
        </div>
    );
}

function computeDateRange(rangeType) {
    const now = new Date();
    if (rangeType === "all") return { start: null, end: null };

    const start = new Date(now);
    if (rangeType === "today") {
        start.setHours(0,0,0,0);
    } else if (rangeType === "this_week") {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start.setDate(diff);
        start.setHours(0,0,0,0);
    } else if (rangeType === "this_month") {
        start.setDate(1);
        start.setHours(0,0,0,0);
    }
    return { start: start.toISOString(), end: now.toISOString() };
}

export default function AdminDashboard() {
    const showToast = useToastStore((state) => state.showToast);
    const [data, setData] = useState(null);
    const [reports, setReports] = useState([]);
    const [shopkeepers, setShopkeepers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState("all");

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const { start, end } = computeDateRange(dateRange);
                const [dashboardRes, reportsRes, shopkeepersRes] = await Promise.all([
                    adminService.getDashboard(start, end),
                    reportService.getReports().catch(() => ({ reports: [] })),
                    adminService.getShopkeepers().catch(() => ({ shopkeepers: [] }))
                ]);
                setData(dashboardRes.data || dashboardRes);
                setReports(reportsRes.reports || []);
                setShopkeepers(shopkeepersRes.shopkeepers || []);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load dashboard.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [dateRange]);

    const handleResolveReport = async (reportId) => {
        try {
            await reportService.resolveReport(reportId);
            setReports((prev) => prev.filter(r => r._id !== reportId));
            showToast("Report marked as resolved", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to resolve report", "error");
        }
    };

    const handleVerifyShopkeeper = async (id) => {
        try {
            await adminService.verifyShopkeeper(id, true);
            setShopkeepers((prev) => 
                prev.map(s => s._id === id ? { ...s, isVerified: true } : s)
            );
            showToast("Shopkeeper verified successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to verify shopkeeper", "error");
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[90px] animate-pulse" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (error || !data) {
        return (
            <PageWrapper>
                <div className="max-w-[480px] mx-auto text-center py-20">
                    <p className="text-sm text-gray-500">{error || "No data available."}</p>
                </div>
            </PageWrapper>
        );
    }

    const categoryStats = data.categoryStats || [];
    const unverifiedShopkeepers = shopkeepers.filter(s => !s.isVerified);

    return (
        <PageWrapper>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-lg font-semibold text-[#1e1b4b] mb-1">Admin Dashboard</h1>
                    <p className="text-xs text-gray-500">Platform-wide metrics</p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#ede9fe] bg-white text-gray-600 outline-none shrink-0 w-max"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                </select>
            </div>

            {/* Core metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard icon={Users} label="Total Users" value={data.totalUsers} />
                <StatCard icon={Briefcase} label="Total Bookings" value={data.totalBookings} />
                <StatCard
                    icon={IndianRupee}
                    label="Platform Revenue"
                    value={data.revenue != null ? `₹${data.revenue}` : null}
                />
                <StatCard
                    icon={Star}
                    label="Avg Worker Rating"
                    value={data.averageRating != null ? data.averageRating.toFixed(1) : null}
                />
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard icon={Briefcase} label="Active Workers" value={data.activeWorkers} />
                <StatCard icon={Briefcase} label="Online Now" value={data.onlineWorkers} sublabel="Currently available" />
                <StatCard icon={Store} label="Total Shopkeepers" value={data.totalShopkeepers} />
                <StatCard
                    icon={Briefcase}
                    label="Completed"
                    value={data.completedBookings}
                    sublabel={data.cancelledBookings != null ? `${data.cancelledBookings} cancelled` : null}
                />
                <StatCard
                    icon={Brain}
                    label="ML Accuracy"
                    value={data.mlAccuracy != null ? `${data.mlAccuracy}%` : null}
                    sublabel="Category prediction"
                />
            </div>

            {/* Unverified Shopkeepers Section */}
            {unverifiedShopkeepers.length > 0 && (
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 mb-4 shadow-sm">
                    <h2 className="text-sm font-bold text-yellow-600 mb-3 flex items-center gap-2">
                        Pending Shopkeeper Verifications ({unverifiedShopkeepers.length})
                    </h2>
                    <div className="flex flex-col gap-3">
                        {unverifiedShopkeepers.map((shopkeeper) => (
                            <div key={shopkeeper._id} className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-[#1e1b4b] mb-1">
                                        {shopkeeper.shopName}
                                        <span className="text-gray-500 font-normal ml-2">({shopkeeper.user?.name || "Owner"})</span>
                                    </p>
                                    <p className="text-xs text-gray-700 mb-1">Address: {shopkeeper.address}</p>
                                    <p className="text-xs text-gray-700 font-mono">GSTIN: {shopkeeper.gstin}</p>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Registered on {new Date(shopkeeper.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleVerifyShopkeeper(shopkeeper._id)}
                                    className="bg-yellow-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors shrink-0"
                                >
                                    Verify Shopkeeper
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Reports Section */}
            <div className="bg-white border border-red-200 rounded-2xl p-5 mb-4 shadow-sm">
                <h2 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                    Active Worker Reports ({reports.length})
                </h2>
                {reports.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {reports.map((report) => (
                            <div key={report._id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-[#1e1b4b] mb-1">
                                        {report.worker?.user?.name || "Unknown Worker"} 
                                        <span className="text-gray-500 font-normal ml-2">({report.booking?.category})</span>
                                    </p>
                                    <p className="text-xs font-semibold text-red-600 mb-2">{report.category}</p>
                                    {report.note && <p className="text-xs text-gray-700 italic bg-white p-2 rounded-lg border border-red-100">"{report.note}"</p>}
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Reported by {report.reporter?.name || "Customer"} on {new Date(report.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleResolveReport(report._id)}
                                    className="bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shrink-0"
                                >
                                    Resolve Report
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No active reports at the moment. Everything looks good!</p>
                    </div>
                )}
            </div>

        </PageWrapper>
    );
}