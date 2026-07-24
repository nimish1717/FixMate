import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function MapPicker({ defaultLocation, onLocationSelect }) {
    const defaultCenter = defaultLocation || { lat: 28.7041, lng: 77.1025 }; // Default to Delhi if no location
    const [position, setPosition] = useState(defaultLocation);

    useEffect(() => {
        if (defaultLocation && !position) {
            setPosition(defaultLocation);
        }
    }, [defaultLocation]);

    useEffect(() => {
        if (position) {
            onLocationSelect(position);
        }
    }, [position]);

    return (
        <div className="w-full h-[200px] rounded-xl overflow-hidden relative z-0 border border-[#ede9fe]">
            <MapContainer center={defaultCenter} zoom={13} className="w-full h-full">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            
            {/* Overlay hint */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-semibold text-[#1e1b4b] shadow flex items-center gap-1.5 z-[1000] pointer-events-none">
                <MapPin size={12} className="text-blue-500" />
                Tap on map to set precise location
            </div>
        </div>
    );
}
