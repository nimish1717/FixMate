import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Phone, ShieldCheck } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const showToast = useToastStore((state) => state.showToast);

    const [step, setStep] = useState("phone"); // "phone" | "otp"
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
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
            await authService.sendOtp({ phone }); // ← now active
            setStep("otp");
        } catch (err) {
            setError(err.response?.data?.message || "Could not send OTP. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 4 && otp.length !== 6) {
            setError("Enter the OTP sent to your phone");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await authService.login({ phone, otp });
            if (res.isRegistered === false) {
                // User doesn't exist — send to Register with phone prefilled
                showToast("Number not registered. Please create an account.", "info");
                navigate("/register", { state: { phone } });
                return;
            }
            login(res.user, res.token);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP. Try again.");
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
                    {step === "phone" ? "Welcome back" : "Verify OTP"}
                </h1>
                <p className="text-sm text-gray-500 text-center mb-6">
                    {step === "phone"
                        ? "Enter your phone number to continue"
                        : `Code sent to +91 ${phone}`}
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

                {/* Step 2: OTP */}
                {step === "otp" && (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                            <ShieldCheck size={16} className="text-gray-400" />
                            <input
                                type="tel"
                                maxLength={6}
                                placeholder="6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins] tracking-[0.3em] font-mono"
                            />
                        </div>

                        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-60 mb-2.5"
                        >
                            {loading ? "Verifying..." : "Verify & Continue"}
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
                <p className="text-center text-xs text-gray-500 mt-4">
                    New here?{" "}
                    <button
                        onClick={() => navigate("/register")}
                        className="text-[#0f172a] font-semibold"
                    >
                        Create an account
                    </button>
                </p>
            </div>
        </div>
    );
}