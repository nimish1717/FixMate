import { useRef } from "react";

// 4 separate digit boxes that behave like one input.
// value/onChange = controlled string (e.g. "482" while typing).
export default function OTPInput({ value, onChange, length = 4 }) {
    const refs = useRef([]);

    const handleChange = (i, digit) => {
        if (!/^\d?$/.test(digit)) return; // only single digits

        const chars = value.split("");
        chars[i] = digit;
        const next = chars.join("").slice(0, length);
        onChange(next);

        if (digit && i < length - 1) {
            refs.current[i + 1]?.focus();
        }
    };

    const handleKeyDown = (i, e) => {
        if (e.key === "Backspace" && !value[i] && i > 0) {
            refs.current[i - 1]?.focus();
        }
    };

    return (
        <div className="flex justify-center gap-2.5">
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (refs.current[i] = el)}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    className="w-10 h-12 border border-[#ede9fe] rounded-[10px] text-center text-xl font-bold text-[#1e1b4b] font-mono bg-[#f8f7ff] outline-none focus:border-[#0f172a]"
                />
            ))}
        </div>
    );
}