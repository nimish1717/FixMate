function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth's radius in km
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Phase 4: Returns distance in metres — used for server-side geofence validation
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    return calculateDistanceInKm(lat1, lon1, lat2, lon2) * 1000;
}

const calculateComingCharge = (booking, isPriceDisagreement) => {
    const BASE_COMING_CHARGE = 30;
    const PLATFORM_FEE = 20;
    
    let distanceTravelledKm = 0;

    if (isPriceDisagreement) {
        // Post-arrival: assume full distance from original calculation (or calculate from worker's shop location)
        distanceTravelledKm = booking.distance || 0; 
    } else {
        // Pre-arrival customer cancellation: calculate distance travelled so far
        if (booking.workerLastLocation && booking.workerLastLocation.lat) {
            // Calculate distance between worker's start location (where they accepted) and their current location
            // Actually the formula says: distance between worker's last known GPS location and customer's booking location.
            // Wait, the formula says: distance worker travelled. If we calculate distance between their last known location 
            // and the customer location, that's the REMAINING distance, not TRAVELLED distance.
            // Let's assume the prompt meant the distance they actually travelled. If we only have their last location 
            // and the customer's location, the travelled distance = total distance - remaining distance.
            // Let's calculate remaining distance.
            const remainingDist = calculateDistanceInKm(
                booking.workerLastLocation.lat,
                booking.workerLastLocation.lng,
                booking.location.coordinates[1], // lat
                booking.location.coordinates[0]  // lng
            );
            const totalDist = booking.distance || remainingDist;
            distanceTravelledKm = Math.max(0, totalDist - remainingDist);
        } else {
            // No GPS yet
            distanceTravelledKm = 0;
        }
    }

    const DISTANCE_CHARGE = distanceTravelledKm * 8;
    let total = BASE_COMING_CHARGE + DISTANCE_CHARGE + PLATFORM_FEE;

    total = Math.max(50, total); // Minimum 50
    total = Math.min(200, total); // Maximum 200

    return Math.round(total);
};

module.exports = {
    calculateComingCharge,
    calculateDistanceInMeters,
};
