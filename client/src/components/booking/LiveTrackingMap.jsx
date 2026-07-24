import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { calculateDistance, estimateEta } from "../../utils/distance";

// Helper component to auto-fit bounds when locations change
function MapBoundsController({ customerLocation, workerLocation }) {
    const map = useMap();

    useEffect(() => {
        if (customerLocation && workerLocation) {
            const bounds = L.latLngBounds(
                [customerLocation.lat, customerLocation.lng],
                [workerLocation.lat, workerLocation.lng]
            );
            // Pad the bounds slightly so markers aren't on the edge
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        } else if (customerLocation) {
            map.setView([customerLocation.lat, customerLocation.lng], 14);
        } else if (workerLocation) {
            map.setView([workerLocation.lat, workerLocation.lng], 14);
        }
    }, [map, customerLocation, workerLocation]);

    return null;
}

// Custom marker icons — default Leaflet icons need explicit image URLs
// since bundlers don't resolve them automatically.
const customerIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const workerIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: "worker-marker", // tinted via CSS below
});

// customerLocation / workerLocation: { lat, lng } or null
export default function LiveTrackingMap({ customerLocation, workerLocation, workerName = "Worker" }) {
    if (!customerLocation) {
        return (
            <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-500">Your location isn't available.</p>
            </div>
        );
    }

    const center = workerLocation || customerLocation;
    const distanceKm = workerLocation
        ? calculateDistance(
            customerLocation.lat, customerLocation.lng,
            workerLocation.lat, workerLocation.lng
        )
        : null;

    return (
        <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
            <div className="h-[260px] relative">
                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapBoundsController customerLocation={customerLocation} workerLocation={workerLocation} />
                    
                    {workerLocation && (
                        <Polyline 
                            positions={[
                                [customerLocation.lat, customerLocation.lng], 
                                [workerLocation.lat, workerLocation.lng]
                            ]} 
                            color="#7c3aed" 
                            weight={3}
                            dashArray="5, 10"
                        />
                    )}
                    
                    <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
                        <Popup>Your location</Popup>
                    </Marker>
                    {workerLocation && (
                        <Marker position={[workerLocation.lat, workerLocation.lng]} icon={workerIcon}>
                            <Popup>{workerName}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Distance / ETA bar */}
            <div className="p-4 flex items-center justify-between">
                {workerLocation ? (
                    <>
                        <div>
                            <p className="text-xs text-gray-500">{workerName} is</p>
                            <p className="text-sm font-semibold text-[#1e1b4b]">
                                {distanceKm < 0.15 ? "Arrived" : `${distanceKm.toFixed(1)} km away`}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">ETA</p>
                            <p className="text-sm font-semibold text-[#0f172a]">
                                {distanceKm < 0.15 ? "Now" : estimateEta(distanceKm)}
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-gray-500">Waiting for {workerName}'s location...</p>
                )}
            </div>

            <style>{`
        .worker-marker { filter: hue-rotate(190deg); }
      `}</style>
        </div>
    );
}