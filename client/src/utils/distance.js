// Haversine formula — straight-line distance between two coordinates in km.
// Matches the same formula your backend uses for geospatial throttling.
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Rough ETA estimate based on average city travel speed (20 km/h)
export function estimateEta(distanceKm) {
    const minutes = Math.round((distanceKm / 20) * 60);
    if (minutes < 1) return "Less than a minute";
    if (minutes === 1) return "1 minute";
    return `${minutes} minutes`;
}