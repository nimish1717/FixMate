import { SERVICE_CATEGORIES } from "../../utils/constants";
import { useSearchStore } from "../../store/searchStore";

// Renders the 4-column emoji service grid.
// Categories come from constants.js — add a service there, it appears here automatically.
export default function ServiceGrid({ onSelectCategory }) {
    const searchQuery = useSearchStore((state) => state.searchQuery);

    const filteredCategories = SERVICE_CATEGORIES.filter((cat) =>
        cat.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[#1e1b4b]">Services</span>
                <button className="text-xs font-semibold text-[#0f172a]">See all</button>
            </div>

            {filteredCategories.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                    No services found matching "{searchQuery}"
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2.5">
                    {filteredCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat)}
                            className="bg-white border border-[#ede9fe] rounded-2xl py-4 px-2.5 flex flex-col items-center gap-1.5 hover:border-[#0f172a] hover:bg-[#f8f7ff] transition-colors"
                        >
                            <span className="text-2xl leading-none">{cat.emoji}</span>
                            <span className="text-[11px] font-medium text-gray-500">{cat.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}