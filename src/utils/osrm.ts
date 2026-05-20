// OSRM Routing Service — Free perfect road routing
export interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
  coordinates: { latitude: number; longitude: number }[];
}

export async function getDrivingRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<OSRMRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    // 5-second timeout so we don't hang the assignment process
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    console.log('[OSRM] Fetching route...');
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();
    console.log(`[OSRM] Response code: ${data.code}`);
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
      
      return {
        distance: route.distance,
        duration: route.duration,
        coordinates
      };
    }
    return null;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.log('[OSRM] Request timed out after 5s');
    } else {
      console.error('[OSRM] API Error:', error);
    }
    return null;
  }
}
