// isOwn = true → message from logged-in user (right side, dark bubble)
// isOwn = false → message from worker (left side, light bubble)
export default function ChatBubble({ text, time, isOwn }) {
    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
            <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl ${isOwn
                        ? "bg-[#0f172a] text-white rounded-br-md"
                        : "bg-white border border-[#ede9fe] text-[#1e1b4b] rounded-bl-md"
                    }`}
            >
                <p className="text-sm leading-relaxed">{text}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
                    {time}
                </p>
            </div>
        </div>
    );
}