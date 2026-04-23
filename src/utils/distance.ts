/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 * Returns the distance in kilometers.
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 
    return distance;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Determines the tier index based on distance. 
 * Lower index = higher priority.
 */
export function getDistanceTier(distanceKm: number): number {
    if (distanceKm <= 3) return 0; // Highest priority (0-3km)
    if (distanceKm <= 7) return 1; // Medium priority (3-7km)
    return 2;                      // Lower priority (7+km)
}
