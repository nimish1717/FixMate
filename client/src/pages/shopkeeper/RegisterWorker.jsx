import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Search, UserCheck } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { shopkeeperService } from "../../services/shopkeeperService";
import { useToastStore } from "../../store/toastStore";

export default function RegisterWorker() {
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [workerFound, setWorkerFound] = useState(null);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (phone.length !== 10) return;
        setLoading(true);
        setError("");
        setWorkerFound(null);
        try {
            const res = await shopkeeperService.searchWorkerByPhone(phone);
            setWorkerFound(res.worker);
        } catch (err) {
            setError(err.response?.data?.message || "Worker not found.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!workerFound) return;
        setLoading(true);
        try {
            await shopkeeperService.requestVerification(workerFound._id);
            showToast("Verification request sent successfully!", "success");
            navigate("/shopkeeper");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#1e1b4b]">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold text-[#1e1b4b]">Add Existing Worker</h1>
            </div>

            <div className="max-w-[480px] mx-auto mt-6 flex flex-col gap-4">
                <div className="bg-[#f8f7ff] border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Workers must register independently first. Enter their registered phone number
                        below to send them a verification request. Once they accept, they will be
                        added to your shop.
                    </p>
                </div>

                {/* Phone Search */}
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#1e1b4b] mb-2">Worker's Phone Number</p>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-500">+91</span>
                            <input
                                type="tel"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                placeholder="9876543210"
                                className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={phone.length !== 10 || loading}
                            className="bg-[#0f172a] text-white px-4 rounded-[10px] disabled:opacity-50 flex items-center justify-center"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                </div>

                {/* Search Result */}
                {workerFound && (
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-4 mt-2">
                        <h3 className="text-sm font-semibold text-[#1e1b4b] mb-3">Worker Found</h3>
                        
                        <div className="flex items-center justify-between bg-[#f8f7ff] p-3 rounded-xl border border-[#ede9fe] mb-4">
                            <div>
                                <p className="text-sm font-bold text-[#1e1b4b]">{workerFound.name}</p>
                                <p className="text-xs text-gray-500">{workerFound.category}</p>
                            </div>
                            <div className="text-right">
                                {workerFound.hasShopkeeper ? (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                        Already Verified
                                    </span>
                                ) : workerFound.hasPendingRequest ? (
                                    <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                        Pending Request
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        Available
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSendRequest}
                            disabled={workerFound.hasShopkeeper || loading}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3.5 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <UserCheck size={18} />
                            {loading ? "Sending..." : "Send Verification Request"}
                        </button>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}