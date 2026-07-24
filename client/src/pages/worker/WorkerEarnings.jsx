import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, IndianRupee, CalendarDays, Calendar } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { workerService } from "../../services/workerService";
import { SERVICE_CATEGORIES } from "../../utils/constants";

function getCategoryEmoji(categoryId) {
    return SERVICE_CATEGORIES.find((c) => c.id === categoryId)?.emoji || "🔧";
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="bg-[#0f172a] rounded-2xl p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Icon size={16} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-300">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white flex items-center gap-1">
                <IndianRupee size={20} />
                {value}
            </p>
        </div>
    );
}

export default function WorkerEarnings() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await workerService.getEarnings();
                setData(res);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load earnings.");
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, []);

    if (loading) {
        return (
            <PageWrapper>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="text-gray-400">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">My Earnings</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 rounded-2xl h-[100px] animate-pulse" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper>
                <div className="max-w-[480px] mx-auto text-center py-20">
                    <p className="text-sm text-gray-500">{error}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-[#0f172a]">
                        ← Go back
                    </button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#1e1b4b] transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-[#1e1b4b]">My Earnings</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <StatCard icon={IndianRupee} label="Today" value={data.summary?.today || 0} />
                <StatCard icon={CalendarDays} label="This Week" value={data.summary?.week || 0} />
                <StatCard icon={Calendar} label="This Month" value={data.summary?.month || 0} />
            </div>

            <h2 className="text-base font-semibold text-[#1e1b4b] mb-4">Transaction History</h2>
            
            {data.history?.length === 0 ? (
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center">
                    <p className="text-sm font-semibold text-[#1e1b4b] mb-1">No earnings yet</p>
                    <p className="text-xs text-gray-500">Complete jobs to start seeing your earnings here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {data.history?.map((ledger) => {
                        const date = new Date(ledger.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                        });
                        const netAmount = ledger.amount - ledger.platformFee;
                        
                        return (
                            <div key={ledger._id} className="bg-white border border-[#ede9fe] rounded-2xl p-4 flex items-center justify-between hover:border-gray-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#f8f7ff] flex items-center justify-center text-lg">
                                        {getCategoryEmoji(ledger.booking?.category)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#1e1b4b] mb-0.5">
                                            {ledger.booking?.category || "Job Completed"}
                                        </p>
                                        <p className="text-[11px] text-gray-500">{date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600 flex items-center justify-end gap-0.5">
                                        + <IndianRupee size={12} /> {netAmount}
                                    </p>
                                    {ledger.platformFee > 0 && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            (Fee: ₹{ledger.platformFee})
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageWrapper>
    );
}
