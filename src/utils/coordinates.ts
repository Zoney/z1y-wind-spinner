import { UserLocation } from '@/types/windmill';
import { grimstadUserLocation } from '@/data/windmill-config';

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

export function convertGPSToFixedWorld(
  gpsCoord: { latitude: number; longitude: number; altitude: number },
  referenceLocation: UserLocation = grimstadUserLocation
): [number, number, number] {
  const deltaLat = (gpsCoord.latitude - referenceLocation.latitude) * Math.PI / 180;
  const deltaLon = (gpsCoord.longitude - referenceLocation.longitude) * Math.PI / 180;
  
  const x = deltaLon * EARTH_RADIUS_KM * 1000 * Math.cos(referenceLocation.latitude * Math.PI / 180);
  const z = -deltaLat * EARTH_RADIUS_KM * 1000;
  const y = gpsCoord.altitude - referenceLocation.altitude;
  
  return [x, y, z];
}

export function getUserOffsetFromReference(
  userLocation: UserLocation,
  referenceLocation: UserLocation = grimstadUserLocation
): [number, number, number] {
  return convertGPSToFixedWorld(userLocation, referenceLocation);
}

export function getCardinalDirection(angle: number): string {
  const normalizedAngle = ((angle * 180 / Math.PI) + 360) % 360;
  
  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'N';
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'NE';
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'E';
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'SE';
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'S';
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'SW';
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'W';
  if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'NW';
  
  return 'N';
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