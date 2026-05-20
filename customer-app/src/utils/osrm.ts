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
    const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
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
  } catch (error) {
    console.error('OSRM API Error:', error);
    return null;
  }
}
