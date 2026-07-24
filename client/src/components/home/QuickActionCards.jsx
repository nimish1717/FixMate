// The two side-by-side cards under the hero: AI Detection + Live Tracking.
// Both are clickable — pass handlers as props so this component
// never needs to know about routing or "coming soon" logic itself.
export default function QuickActionCards({ onAIClick, onTrackingClick }) {
    const cards = [
        {
            title: "AI Problem Detection",
            subtitle: "Photo your issue — we identify it",
            emoji: "📸",
            onClick: onAIClick,
        },
        {
            title: "Live Tracking",
            subtitle: "Track your worker in real-time",
            emoji: "📍",
            onClick: onTrackingClick,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3.5 mb-5">
            {cards.map((card) => (
                <button
                    key={card.title}
                    onClick={card.onClick}
                    className="bg-white border border-[#ede9fe] rounded-2xl p-4.5 flex items-center justify-between text-left hover:border-[#0f172a] transition-colors"
                >
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[#1e1b4b] mb-1">
                            {card.title}
                        </h3>
                        <p className="text-xs text-gray-500">{card.subtitle}</p>
                    </div>
                    <div className="text-[38px] leading-none ml-3">{card.emoji}</div>
                </button>
            ))}
        </div>
    );
}