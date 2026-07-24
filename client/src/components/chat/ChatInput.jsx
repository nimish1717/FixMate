import { useState } from "react";
import { Send } from "lucide-react";

// Controlled input + send button. onSend receives the trimmed text
// and clears the input itself — parent doesn't manage input state.
export default function ChatInput({ onSend, disabled }) {
    const [text, setText] = useState("");

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-center gap-2 bg-white border border-[#ede9fe] rounded-2xl px-3 py-2">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={disabled}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#1e1b4b] placeholder:text-gray-400 font-[Poppins] disabled:opacity-50"
            />
            <button
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                className="w-9 h-9 rounded-full bg-[#0f172a] flex items-center justify-center disabled:opacity-30 flex-shrink-0"
            >
                <Send size={15} className="text-white" />
            </button>
        </div>
    );
}