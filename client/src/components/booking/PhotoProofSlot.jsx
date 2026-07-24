import { useRef } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";

// One slot for either "before" or "after" photo.
// states: empty (dashed border) -> uploading -> uploaded (solid green border)
export default function PhotoProofSlot({ label, imageUrl, uploading, onUpload, disabled, readOnly }) {
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) onUpload(file);
    };

    const isUploaded = !!imageUrl;

    return (
        <div
            onClick={() => !readOnly && !disabled && !isUploaded && fileInputRef.current?.click()}
            className={`flex-1 h-[110px] relative rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors ${readOnly
                    ? (isUploaded ? "border border-[#ede9fe] bg-gray-50" : "border border-gray-100 bg-gray-50")
                    : (isUploaded
                        ? "border-2 border-green-400 bg-green-50"
                        : disabled
                            ? "border-2 border-dashed border-gray-200 bg-gray-50 cursor-not-allowed"
                            : "border-2 border-dashed border-[#ede9fe] bg-white hover:border-[#0f172a] cursor-pointer")
                }`}
        >
            {uploading ? (
                <>
                    <Loader2 size={22} className="text-[#0f172a] animate-spin" />
                    <span className="text-xs text-gray-500">Uploading...</span>
                </>
            ) : isUploaded ? (
                <>
                    <img src={imageUrl} alt={label} className="w-full h-full object-cover rounded-2xl" />
                    {!readOnly && (
                        <CheckCircle2
                            size={18}
                            className="text-green-500 absolute top-2 right-2 bg-white rounded-full"
                        />
                    )}
                </>
            ) : (
                <>
                    {!readOnly && <Camera size={20} className={disabled ? "text-gray-300" : "text-gray-400"} />}
                    <span className={`text-xs ${disabled || readOnly ? "text-gray-400" : "text-gray-500"} text-center px-2`}>
                        {readOnly ? `Waiting for worker to upload ${label.toLowerCase()} photo` : label}
                    </span>
                </>
            )}

            {!readOnly && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                />
            )}
        </div>
    );
}