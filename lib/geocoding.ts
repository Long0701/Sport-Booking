/**
 * Geocoding utility functions using OpenStreetMap Nominatim API
 */

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Convert address to coordinates using Nominatim API
 * @param address The address to geocode
 * @returns Promise<Coordinates | null> The coordinates or null if geocoding fails
 */
export async function getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
  if (!address?.trim()) return null;
  
  try {
    console.log('Geocoding address:', address);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { 
        headers: { "Accept-Language": "vi,en;q=0.8" },
        // Add user agent to be respectful to the service
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (!data || data.length === 0) {
      console.log('No geocoding results found for address:', address);
      return null;
    }
    
    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
    
    // Validate coordinates
    if (isNaN(result.lat) || isNaN(result.lng)) {
      console.error('Invalid coordinates from geocoding:', result);
      return null;
    }
    
    console.log('Geocoded successfully:', address, '→', result);
    return result;
    
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}
