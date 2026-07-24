import { useNavigate } from "react-router-dom";
import {
    Wrench, Camera, ShieldCheck, MapPin, Star,
    Zap, ArrowRight
} from "lucide-react";

const SERVICES = [
    { emoji: "🔧", label: "Plumbing" },
    { emoji: "⚡", label: "Electrical" },
    { emoji: "🪚", label: "Carpentry" },
    { emoji: "❄️", label: "AC Repair" },
    { emoji: "💧", label: "RO Repair" },
    { emoji: "🧹", label: "Cleaning" },
    { emoji: "🖌️", label: "Painting" },
    { emoji: "🐛", label: "Pest Control" },
];

const FEATURES = [
    {
        icon: Camera,
        title: "AI Problem Detection",
        desc: "Snap a photo. Our AI instantly identifies the issue and the exact worker you need — no guesswork.",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: ShieldCheck,
        title: "Shopkeeper-Verified Workers",
        desc: "Every worker is personally vouched for by a local hardware shop. Real trust, not just a star rating.",
        color: "bg-green-50 text-green-600",
    },
    {
        icon: Zap,
        title: "Live OTP Verification",
        desc: "Two-step OTP confirms arrival and completion. AI checks before/after photos. No fake jobs.",
        color: "bg-yellow-50 text-yellow-600",
    },
    {
        icon: MapPin,
        title: "Real-Time Tracking",
        desc: "Watch your worker arrive in real-time. Chat instantly. Know exactly when help is coming.",
        color: "bg-purple-50 text-purple-600",
    },
];

const STEPS = [
    { num: "01", title: "Snap & Detect", desc: "Photo your issue — AI tells you what it is and who to call." },
    { num: "02", title: "Book Instantly", desc: "Pick a trusted, verified worker near you. Pay ₹5 to confirm." },
    { num: "03", title: "Track Live", desc: "See your worker arrive. Chat in-app. Verify with OTP." },
    { num: "04", title: "Done & Reviewed", desc: "AI verifies the work. Pay. Leave a review. Simple." },
];

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="bg-[#f8f7ff] font-[Poppins] overflow-x-hidden">

            {/* ---------- NAVBAR ---------- */}
            <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                        <Wrench size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-[#1e1b4b]">FixKar</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/admin/login")}
                        className="hidden md:block text-sm font-semibold text-gray-500 hover:text-[#1e1b4b] px-2 py-2 transition-colors"
                    >
                        Admin
                    </button>
                    <button
                        onClick={() => navigate("/login")}
                        className="text-sm font-semibold text-[#1e1b4b] px-4 py-2"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="text-sm font-semibold bg-[#0f172a] text-white px-5 py-2.5 rounded-[10px]"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ---------- HERO ---------- */}
            <section className="relative max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-20 md:pt-16 md:pb-32">
                {/* Floating decorative blobs */}
                <div className="absolute -top-20 right-0 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 -left-20 w-64 h-64 bg-[#0f172a]/5 rounded-full blur-3xl" />

                <div className="relative grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white border border-[#ede9fe] rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-[#0f172a]">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                            Now live in your city
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-[#1e1b4b] leading-[1.1] tracking-tight mb-5">
                            Got a problem?
                            <br />
                            <span className="relative inline-block">
                                Just take a photo.
                                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                                    <path d="M0,5 Q50,10 100,5 T200,5" stroke="#2563eb" strokeWidth="4" fill="none" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>

                        <p className="text-base md:text-lg text-gray-500 mb-8 max-w-md leading-relaxed">
                            FixKar's AI identifies your home repair issue instantly and connects
                            you with a <span className="font-semibold text-[#1e1b4b]">shopkeeper-verified</span> plumber,
                            electrician, or technician near you — in minutes.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-10">
                            <button
                                onClick={() => navigate("/register")}
                                className="flex items-center gap-2 bg-[#0f172a] text-white text-sm font-semibold px-6 py-3.5 rounded-[10px] hover:bg-[#1e293b] transition-colors"
                            >
                                <Camera size={17} />
                                Scan your problem
                                <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => navigate("/login")}
                                className="flex items-center gap-2 bg-white border border-[#ede9fe] text-[#1e1b4b] text-sm font-semibold px-6 py-3.5 rounded-[10px]"
                            >
                                I'm a worker / shop →
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8">
                            <div>
                                <p className="text-2xl font-bold text-[#1e1b4b]">96%</p>
                                <p className="text-xs text-gray-500">Trust Score Avg</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#1e1b4b]">₹5</p>
                                <p className="text-xs text-gray-500">Booking Token</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#1e1b4b]">8</p>
                                <p className="text-xs text-gray-500">Service Categories</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="relative">
                        <div className="relative bg-[#0f172a] rounded-[28px] p-8 overflow-hidden">
                            <div className="absolute right-8 top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
                            <div className="absolute left-8 bottom-8 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />

                            <div className="relative z-10 text-center py-6">
                                <div className="text-[100px] leading-none mb-2 animate-bounce" style={{ animationDuration: "3s" }}>
                                    👷
                                </div>
                                <div className="bg-white rounded-2xl p-4 mt-4 shadow-xl">
                                    <p className="text-xs text-gray-400 mb-1.5">Detected Category</p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">⚡</span>
                                        <span className="text-base font-bold text-[#1e1b4b]">Electrical Issue</span>
                                    </div>
                                    <div className="h-2 bg-[#f8f7ff] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#0f172a] rounded-full w-[94%]" />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">94% confidence</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating mini cards */}
                        <div className="absolute -left-6 top-1/3 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5 animate-float">
                            <div className="w-9 h-9 rounded-[8px] bg-green-100 flex items-center justify-center">
                                <ShieldCheck size={16} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#1e1b4b]">Verified</p>
                                <p className="text-[10px] text-gray-400">via Sharma Hardware</p>
                            </div>
                        </div>

                        <div className="absolute -right-4 bottom-10 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2 animate-float-reverse">
                            <Star size={15} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-bold text-[#1e1b4b]">96 Trust Score</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- SERVICES MARQUEE ---------- */}
            <section className="border-y border-[#ede9fe] bg-white py-6 overflow-hidden">
                <div className="flex gap-12 animate-[scroll_25s_linear_infinite] whitespace-nowrap">
                    {[...SERVICES, ...SERVICES, ...SERVICES].map((s, i) => (
                        <span key={i} className="text-base font-semibold text-gray-400 flex items-center gap-2">
                            <span className="text-xl">{s.emoji}</span> {s.label}
                        </span>
                    ))}
                </div>
            </section>

            {/* ---------- FEATURES ---------- */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-20">
                <div className="text-center mb-14">
                    <p className="text-xs font-bold text-[#0f172a] uppercase tracking-widest mb-3">Why FixKar</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e1b4b] tracking-tight">
                        Built for trust. Powered by AI.
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className="bg-white border border-[#ede9fe] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                                <f.icon size={22} />
                            </div>
                            <h3 className="text-base font-semibold text-[#1e1b4b] mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- HOW IT WORKS ---------- */}
            <section className="bg-[#0f172a] py-20">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="text-center mb-14">
                        <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">How it works</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            From problem to fixed. In 4 steps.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {STEPS.map((step, i) => (
                            <div key={step.num} className="relative">
                                <p className="text-5xl font-bold text-white/10 mb-3">{step.num}</p>
                                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-blue-200/70 leading-relaxed">{step.desc}</p>
                                {i < STEPS.length - 1 && (
                                    <ArrowRight size={18} className="hidden md:block absolute top-2 -right-4 text-white/20" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- SERVICES GRID ---------- */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-20">
                <div className="text-center mb-12">
                    <p className="text-xs font-bold text-[#0f172a] uppercase tracking-widest mb-3">Services</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e1b4b] tracking-tight">
                        Whatever's broken, we've got it.
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SERVICES.map((s) => (
                        <div
                            key={s.label}
                            onClick={() => navigate("/register")}
                            className="bg-white border border-[#ede9fe] rounded-2xl p-6 text-center cursor-pointer hover:border-[#0f172a] hover:bg-[#f8f7ff] transition-colors"
                        >
                            <div className="text-4xl mb-3">{s.emoji}</div>
                            <p className="text-sm font-semibold text-[#1e1b4b]">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- CTA ---------- */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 pb-20">
                <div className="relative bg-[#0f172a] rounded-[28px] px-8 md:px-16 py-16 text-center overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
                            Stop searching.<br />Start fixing.
                        </h2>
                        <p className="text-blue-200/70 mb-8 max-w-md mx-auto">
                            Join FixKar today — your home's problems are one photo away from being solved.
                        </p>
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-white text-[#0f172a] text-sm font-semibold px-8 py-4 rounded-[10px] inline-flex items-center gap-2 hover:bg-blue-50 transition-colors"
                        >
                            Get Started Free
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ---------- FOOTER ---------- */}
            <footer className="bg-[#0f172a] text-white">
                {/* Main footer body */}
                <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

                        {/* Brand column */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-10 h-10 bg-white/10 rounded-[10px] flex items-center justify-center">
                                    <Wrench size={20} className="text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">FixKar</span>
                            </div>
                            <p className="text-sm text-blue-200/60 leading-relaxed max-w-xs mb-6">
                                India's first AI-powered home repair platform. Snap a photo,
                                book a shopkeeper-verified worker, track in real-time.
                            </p>
                            <p className="text-xs text-white/25 font-medium tracking-wider uppercase">
                                Fix karo, apne ghar ke kaam
                            </p>
                        </div>

                        {/* Services column */}
                        <div>
                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Services</p>
                            <ul className="space-y-2.5">
                                {["Plumbing", "Electrical", "Carpentry", "AC Repair", "RO Repair", "Cleaning", "Painting", "Pest Control"].map((s) => (
                                    <li key={s}>
                                        <button
                                            onClick={() => navigate("/register")}
                                            className="text-sm text-blue-200/60 hover:text-white transition-colors"
                                        >
                                            {s}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company column */}
                        <div>
                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Platform</p>
                            <ul className="space-y-2.5 mb-8">
                                {[
                                    { label: "For Customers", to: "/register" },
                                    { label: "For Workers", to: "/login" },
                                    { label: "For Shopkeepers", to: "/login" },
                                    { label: "Admin Portal", to: "/admin/login" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <button
                                            onClick={() => navigate(item.to)}
                                            className="text-sm text-blue-200/60 hover:text-white transition-colors"
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Support</p>
                            <ul className="space-y-2.5">
                                {["Help Center", "Privacy Policy", "Terms of Service"].map((s) => (
                                    <li key={s}>
                                        <span className="text-sm text-blue-200/60 cursor-pointer hover:text-white transition-colors">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-white/30">
                            © 2025 FixKar. All rights reserved.
                        </p>
                        <p className="text-xs text-white/20 font-medium">
                            Designed & built by{" "}
                            <span className="text-white/40 font-semibold">Nischal Agarwal</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}