import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserX, PowerOff, Save, ShieldCheck } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { shopkeeperService } from "../../services/shopkeeperService";
import { workerService } from "../../services/workerService";
import { SERVICE_CATEGORIES } from "../../utils/constants";
import { useToastStore } from "../../store/toastStore";

export default function ManageWorker() {
    const { id } = useParams();
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);

    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [category, setCategory] = useState("");
    const [experience, setExperience] = useState("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                // workerService.getWorkerById fetches the detailed profile
                const res = await workerService.getWorkerById(id);
                const w = res.worker;
                setWorker(w);
                setCategory(w.category || "");
                setExperience(w.experience?.toString() || "");
                setIsActive(w.isActive ?? true);
            } catch (err) {
                setError("Could not load worker details.");
            } finally {
                setLoading(false);
            }
        };
        fetchWorker();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await shopkeeperService.updateWorker(id, {
                category,
                experience: Number(experience),
                isActive,
                status: isActive ? undefined : "offline" // force offline if deactivated
            });
            showToast("Worker updated successfully", "success");
            navigate("/shopkeeper");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update worker", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm(`Are you sure you want to completely remove ${worker.user?.name}? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await shopkeeperService.removeWorker(id);
            showToast("Worker removed successfully", "success");
            navigate("/shopkeeper");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to remove worker", "error");
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                    <div className="h-20 bg-gray-200 rounded-2xl" />
                </div>
            </PageWrapper>
        );
    }

    if (error || !worker) {
        return (
            <PageWrapper>
                <div className="text-center py-20">
                    <p className="text-sm text-gray-500">{error || "Worker not found."}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-[#0f172a]">
                        ← Go back
                    </button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#1e1b4b] transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-semibold text-[#1e1b4b]">Manage Worker</h1>
                </div>
            </div>

            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6 border-b border-[#ede9fe] pb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#1e1b4b] flex items-center gap-2">
                            {worker.user?.name}
                            {worker.isVerified && <ShieldCheck size={16} className="text-green-500" />}
                        </h2>
                        <p className="text-sm text-gray-500">{worker.user?.phone}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-[#1e1b4b]">{worker.trustScore ?? worker.rating?.toFixed(1) ?? "—"}</span>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Trust Score</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#1e1b4b] mb-1.5">Service Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-xl px-4 py-3 text-sm text-[#1e1b4b] outline-none focus:border-[#0f172a]"
                        >
                            <option value="">Select Category</option>
                            {SERVICE_CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#1e1b4b] mb-1.5">Experience (Years)</label>
                        <input
                            type="number"
                            min="0"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-xl px-4 py-3 text-sm text-[#1e1b4b] outline-none focus:border-[#0f172a]"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 mb-24">
                <h3 className="text-sm font-bold text-[#1e1b4b] mb-4">Danger Zone</h3>
                
                <div className="flex items-center justify-between py-3 border-b border-[#ede9fe]">
                    <div>
                        <p className="text-sm font-semibold text-[#1e1b4b]">Active Status</p>
                        <p className="text-[11px] text-gray-500">Temporarily hide worker from searches (e.g. on leave).</p>
                    </div>
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="pt-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-600">Remove Worker</p>
                        <p className="text-[11px] text-gray-500">Permanently remove from your shop.</p>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="bg-red-50 text-red-600 p-2.5 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <UserX size={18} />
                    </button>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#ede9fe] max-w-[480px] mx-auto z-50">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#0f172a] text-white text-sm font-semibold rounded-2xl py-3.5 hover:bg-[#1e1b4b] transition-colors disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </PageWrapper>
    );
}
