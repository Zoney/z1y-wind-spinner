export interface WindmillConfig {
  id: string;
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  height: number;
  bladeWidth: number;
  bladeLength: number;
  rotationSpeed: number;
  noiseLevel: {
    distance100m: number;
    distance500m: number;
    distance1km: number;
    distance2km: number;
  };
  maskedAreas?: MaskedArea[];
}

export interface MaskedArea {
  id: string;
  vertices: Array<{x: number; y: number; z: number}>;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude: number;
}