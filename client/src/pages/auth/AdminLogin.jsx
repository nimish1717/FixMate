import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

export default function AdminLogin() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Enter email and password");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const { user, token } = await authService.adminLogin({ email, password });
            login(user, token);
            navigate("/admin");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff] px-4">
            <div className="w-full max-w-[380px] bg-white border border-[#ede9fe] rounded-2xl p-7">

                <div className="flex items-center gap-2.5 mb-6 justify-center">
                    <div className="w-9 h-9 bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <span className="text-[18px] font-bold text-[#1e1b4b]">FixKar Admin</span>
                </div>

                <h1 className="text-lg font-semibold text-[#1e1b4b] text-center mb-1">
                    Admin Login
                </h1>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Restricted access — administrators only
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                        <Mail size={16} className="text-gray-400" />
                        <input
                            type="email"
                            placeholder="admin@fixkar.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-[#f8f7ff] border border-[#ede9fe] rounded-[10px] px-3.5 py-3 mb-3">
                        <Lock size={16} className="text-gray-400" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 w-full font-[Poppins]"
                        />
                    </div>

                    {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0f172a] text-white text-sm font-semibold rounded-[10px] py-3 disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}