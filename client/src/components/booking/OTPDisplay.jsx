// Big monospace OTP display. Shown when booking:otpGenerated fires.
// type: "arrival" | "completion" — controls the label text.
export default function OTPDisplay({ otp, type }) {
    if (!otp) return null;

    const labels = {
        arrival: "Share this with your worker on arrival",
        completion: "Enter this code once the worker confirms job completion",
    };

    return (
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5 text-center">
            <p className="text-xs text-gray-500 mb-3">{labels[type] || "Your OTP"}</p>

            <div className="flex justify-center gap-2.5 mb-2">
                {otp.split("").map((digit, i) => (
                    <div
                        key={i}
                        className="w-10 h-12 border border-[#ede9fe] rounded-[10px] flex items-center justify-center text-xl font-bold text-[#1e1b4b] font-mono bg-[#f8f7ff]"
                    >
                        {digit}
                    </div>
                ))}
            </div>

            <p className="text-[11px] text-gray-400">
                {type === "arrival" ? "Arrival OTP" : "Completion OTP"}
            </p>
        </div>
    );
}