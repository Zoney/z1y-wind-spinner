import { UserLocation } from '@/types/windmill';

const EARTH_RADIUS_KM = 6371;

export function convertGPSToLocal(
  gpsCoord: { latitude: number; longitude: number; altitude: number },
  userLocation: UserLocation
): [number, number, number] {
  const deltaLat = (gpsCoord.latitude - userLocation.latitude) * Math.PI / 180;
  const deltaLon = (gpsCoord.longitude - userLocation.longitude) * Math.PI / 180;
  
  const x = deltaLon * EARTH_RADIUS_KM * 1000 * Math.cos(userLocation.latitude * Math.PI / 180);
  const z = -deltaLat * EARTH_RADIUS_KM * 1000;
  const y = gpsCoord.altitude - userLocation.altitude;
  
  return [x, y, z];
}

export function calculateDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const deltaLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000; // Return distance in meters
}

export function getNoiseLevel(distance: number, windmillConfig: { noiseLevel: { distance100m: number; distance500m: number; distance1km: number; distance2km: number } }): number {
  if (distance <= 100) return windmillConfig.noiseLevel.distance100m;
  if (distance <= 500) return windmillConfig.noiseLevel.distance500m;
  if (distance <= 1000) return windmillConfig.noiseLevel.distance1km;
  if (distance <= 2000) return windmillConfig.noiseLevel.distance2km;
  return 0;
}