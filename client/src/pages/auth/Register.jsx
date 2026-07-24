import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Wrench, Phone, User, ShieldCheck } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);

    // If redirected from Login with a phone already entered, prefill it
    const prefillPhone = location.state?.phone || "";

    const [step, setStep] = useState(prefillPhone ? "details" : "phone");
    const [phone, setPhone] = useState(prefillPhone);
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [role, setRole] = useState("user");
    const [category, setCategory] = useState("Plumbing");
    const [aadhaar, setAadhaar] = useState("");
    const [shopName, setShopName] = useState("");
    const [address, setAddress] = useState("");
    const [gstin, setGstin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (phone.length !== 10) {
            setError("Enter a valid 10-digit phone number");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await authService.sendOtp({ phone });
            setStep("details");
        } catch (err) {
            setError(err.response?.data?.message || "Could not send OTP. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }
        if (otp.length !== 4 && otp.length !== 6) {
            setError("Enter the OTP sent to your phone");
            return;
        }
        if (role === "worker" && aadhaar.length !== 12) {
            setError("Please enter a valid 12-digit Aadhaar number");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const { user, token } = await authService.register({
                name: name.trim(),
                phone,
                otp,
                role,
                category: role === "worker" ? category : undefined,
                aadhaar: role === "worker" ? aadhaar : undefined,
                shopName: role === "shopkeeper" ? shopName.trim() : undefined,
                address: role === "shopkeeper" ? address.trim() : undefined,
                gstin: role === "shopkeeper" ? gstin.trim() : undefined,
            });
            login(user, token);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7ff] px-4">
            <div className="w-full max-w-[380px] bg-white border border-[#ede9fe] rounded-2xl p-7">

                {/* Brand */}
                <div className="flex items-center gap-2.5 mb-6 justify-center">
                    <div className="w-9 h-9 bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                        <Wrench size={18} className="text-white" />
                    </div>
                    <span className="text-[18px] font-bold text-[#1e1b4b]">FixKar</span>
                </div>

                <h1 className="text-lg font-semibold text-[#1e1b4b] text-center mb-1">
                    {step === "phone" ? "Create your account" : "Almost there"}
                </h1>
                <p className="text-sm text-gray-500 text-center mb-6">
                    {step === "phone"
                        ? "Enter your phone number to get started"
                        : `Enter your name and the code sent to +91 ${phone}`}
                </p>

                {/* Step 1: Phone */}
                {step === "phone" && (
                    <form onSubmit={handleSendOtp}>
                        <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-500">+91</span>
                            <input
                                type="tel"
                                maxLength={10}
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                            />
                        </div>

                        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-60"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {/* Step 2: Name + OTP */}
                {step === "details" && (
                    <form onSubmit={handleRegister}>
                        <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                            <User size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                            <ShieldCheck size={16} className="text-gray-400" />
                            <input
                                type="tel"
                                maxLength={6}
                                placeholder="OTP code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins] tracking-[0.3em] font-mono"
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="flex gap-2 mb-3">
                            {["user", "worker", "shopkeeper"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-[10px] border transition-colors ${role === r
                                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                                        : "bg-[#f8f7ff] text-gray-500 border-[#ede9fe] hover:bg-gray-100"
                                        }`}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>

                        {role === "worker" && (
                            <>
                                <div className="mb-3">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 text-sm text-[#1e1b4b] outline-none font-[Poppins]"
                                    >
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="AC Repair">AC Repair</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        maxLength={12}
                                        placeholder="12-digit Aadhaar Number"
                                        value={aadhaar}
                                        onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                                        className="bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full outline-none font-[Poppins] tracking-widest font-mono"
                                    />
                                </div>
                            </>
                        )}

                        {role === "shopkeeper" && (
                            <>
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        placeholder="Shop Name"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        className="bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full outline-none font-[Poppins]"
                                    />
                                </div>
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        placeholder="Shop Address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full outline-none font-[Poppins]"
                                    />
                                </div>
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        placeholder="GSTIN (Optional)"
                                        value={gstin}
                                        onChange={(e) => setGstin(e.target.value)}
                                        className="bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full outline-none font-[Poppins]"
                                    />
                                </div>
                            </>
                        )}

                        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-60 mb-2.5"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep("phone")}
                            className="w-full text-xs text-gray-500 py-1"
                        >
                            Change phone number
                        </button>
                    </form>
                )}

                {/* Link to login */}
                <p className="text-center text-xs text-gray-500 mt-4">
                    Already have an account?{" "}
                    <button
                        onClick={() => navigate("/login")}
                        className="text-[#0f172a] font-semibold"
                    >
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );
}