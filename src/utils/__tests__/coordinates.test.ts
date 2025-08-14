import {
  convertGPSToLocal,
  convertGPSToFixedWorld,
  getUserOffsetFromReference,
  calculateDistance,
  getCardinalDirection,
  getNoiseLevel
} from '../coordinates';
import { grimstadUserLocation } from '@/data/windmill-config';

describe('Coordinate System Functions', () => {
  // Real GPS coordinates from Grimstad Wind Farm
  const userLocation = grimstadUserLocation; // 58.298376, 8.474080, altitude: 50
  
  const testWindmills = [
    {
      id: 'turbine-1',
      latitude: 58.2956418537468,
      longitude: 8.451679576883995,
      altitude: 95
    },
    {
      id: 'turbine-2', 
      latitude: 58.29403511095341,
      longitude: 8.461204147246681,
      altitude: 90
    },
    {
      id: 'turbine-3',
      latitude: 58.29513202979918,
      longitude: 8.456471258887445,
      altitude: 88
    }
  ];

  describe('convertGPSToLocal', () => {
    test('should convert GPS coordinates to correct local 3D positions', () => {
      // Test with turbine-1 (should be southwest of user)
      const [x, y, z] = convertGPSToLocal(testWindmills[0], userLocation);
      
      // Expected: North = +X, East = +Z
      expect(x).toBeCloseTo(-304, 0); // South (negative X)
      expect(y).toBeCloseTo(45, 0); // Height difference (95-50)
      expect(z).toBeCloseTo(-1309, 0); // West (negative Z)
    });

    test('should handle same location (returns origin)', () => {
      const [x, y, z] = convertGPSToLocal(userLocation, userLocation);
      
      expect(x).toBeCloseTo(0, 1);
      expect(y).toBeCloseTo(0, 1);
      expect(z).toBeCloseTo(0, 1);
    });

    test('should convert multiple windmill positions correctly', () => {
      const positions = testWindmills.map(windmill => 
        convertGPSToLocal(windmill, userLocation)
      );

      // All positions should be reasonable distances
      positions.forEach(([x, y, z]) => {
        const distance = Math.sqrt(x*x + z*z);
        expect(distance).toBeGreaterThan(100); // At least 100m away
        expect(distance).toBeLessThan(5000); // Less than 5km away
        expect(Math.abs(y)).toBeLessThan(200); // Reasonable altitude differences
      });
    });
  });

  describe('convertGPSToFixedWorld', () => {
    test('should convert to fixed world coordinates consistently', () => {
      const [x, y, z] = convertGPSToFixedWorld(testWindmills[0]);
      
      // Should be consistent with local coordinates when user is at reference
      const [localX, localY, localZ] = convertGPSToLocal(testWindmills[0], grimstadUserLocation);
      
      expect(x).toBeCloseTo(localX, 1);
      expect(y).toBeCloseTo(localY, 1);
      expect(z).toBeCloseTo(localZ, 1);
    });
  });

  describe('calculateDistance', () => {
    test('should calculate accurate GPS distances', () => {
      // Distance from user to turbine-1
      const distance = calculateDistance(userLocation, testWindmills[0]);
      
      // Expected distance is approximately 1344 meters (from our calculations)
      expect(distance).toBeCloseTo(1344, -1); // Within 10m tolerance
    });

    test('should return zero for same coordinates', () => {
      const distance = calculateDistance(userLocation, userLocation);
      expect(distance).toBeCloseTo(0, 1);
    });

    test('should calculate distances between all test windmills', () => {
      const distances = testWindmills.map(windmill => 
        calculateDistance(userLocation, windmill)
      );

      // All distances should be positive and reasonable
      distances.forEach(distance => {
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeLessThan(5000); // Less than 5km
      });

      // Turbine-2 should be closer than turbine-1 (based on our calculations)
      expect(distances[1]).toBeLessThan(distances[0]);
    });
  });
});

describe('Cardinal Direction Functions', () => {
  describe('getCardinalDirection', () => {
    test('should correctly identify cardinal directions', () => {
      // Test all 8 main directions using our coordinate system (North = +X, East = +Z)
      expect(getCardinalDirection(0)).toBe('N');           // 0° = North
      expect(getCardinalDirection(Math.PI/4)).toBe('NE');  // 45° = Northeast  
      expect(getCardinalDirection(Math.PI/2)).toBe('E');   // 90° = East
      expect(getCardinalDirection(3*Math.PI/4)).toBe('SE'); // 135° = Southeast
      expect(getCardinalDirection(Math.PI)).toBe('S');     // 180° = South
      expect(getCardinalDirection(-3*Math.PI/4)).toBe('SW'); // 225° = Southwest
      expect(getCardinalDirection(-Math.PI/2)).toBe('W');  // 270° = West
      expect(getCardinalDirection(-Math.PI/4)).toBe('NW'); // 315° = Northwest
    });

    test('should handle angle normalization', () => {
      // Test angles beyond 360°
      expect(getCardinalDirection(2 * Math.PI)).toBe('N'); // 360° = North
      expect(getCardinalDirection(3 * Math.PI)).toBe('S'); // 540° = South
      
      // Test negative angles
      expect(getCardinalDirection(-Math.PI)).toBe('S'); // -180° = South
    });

    test('should handle boundary cases', () => {
      // Test angles at boundaries between directions (22.5° boundaries)
      expect(getCardinalDirection(Math.PI/8)).toBe('NE'); // 22.5° = Northeast (at boundary)
      expect(getCardinalDirection(Math.PI/8 - 0.01)).toBe('N'); // Just under 22.5° = North
      expect(getCardinalDirection(3*Math.PI/8)).toBe('E'); // 67.5° = East (at boundary)
      expect(getCardinalDirection(3*Math.PI/8 - 0.01)).toBe('NE'); // Just under 67.5° = Northeast
    });
  });
});

describe('Audio/Noise Functions', () => {
  describe('getNoiseLevel', () => {
    const mockWindmillConfig = {
      noiseLevel: {
        distance100m: 45,
        distance500m: 35, 
        distance1km: 25,
        distance2km: 15
      }
    };

    test('should return correct noise levels for different distances', () => {
      expect(getNoiseLevel(50, mockWindmillConfig)).toBe(45);   // < 100m
      expect(getNoiseLevel(100, mockWindmillConfig)).toBe(45);  // = 100m
      expect(getNoiseLevel(300, mockWindmillConfig)).toBe(35);  // < 500m
      expect(getNoiseLevel(500, mockWindmillConfig)).toBe(35);  // = 500m
      expect(getNoiseLevel(750, mockWindmillConfig)).toBe(25);  // < 1km
      expect(getNoiseLevel(1000, mockWindmillConfig)).toBe(25); // = 1km
      expect(getNoiseLevel(1500, mockWindmillConfig)).toBe(15); // < 2km
      expect(getNoiseLevel(2000, mockWindmillConfig)).toBe(15); // = 2km
      expect(getNoiseLevel(3000, mockWindmillConfig)).toBe(0);  // > 2km
    });

    test('should handle edge cases', () => {
      expect(getNoiseLevel(0, mockWindmillConfig)).toBe(45);     // Zero distance
      expect(getNoiseLevel(99.9, mockWindmillConfig)).toBe(45);  // Just under 100m
      expect(getNoiseLevel(100.1, mockWindmillConfig)).toBe(35); // Just over 100m
    });
  });
});

describe('Coordinate System Integration Tests', () => {
  const testWindmills = [
    {
      id: 'turbine-1',
      latitude: 58.2956418537468,
      longitude: 8.451679576883995,
      altitude: 95
    },
    {
      id: 'turbine-2', 
      latitude: 58.29403511095341,
      longitude: 8.461204147246681,
      altitude: 90
    },
    {
      id: 'turbine-3',
      latitude: 58.29513202979918,
      longitude: 8.456471258887445,
      altitude: 88
    }
  ];
  const userLocation = grimstadUserLocation;

  test('should maintain coordinate system consistency', () => {
    // Test that our coordinate system is mathematically consistent
    const windmill = testWindmills[0];
    const [x, y, z] = convertGPSToLocal(windmill, userLocation);
    
    // Calculate distance using 3D coordinates
    const distance3D = Math.sqrt(x*x + z*z); // Only horizontal distance
    
    // Calculate distance using GPS function
    const distanceGPS = calculateDistance(userLocation, windmill);
    
    // These should be approximately equal (within 1% tolerance)
    expect(Math.abs(distance3D - distanceGPS) / distanceGPS).toBeLessThan(0.01);
  });

  test('should correctly position all Grimstad windmills in expected directions', () => {
    // Based on real geography, most turbines should be west/southwest of user
    const positions = testWindmills.map(windmill => {
      const [x, y, z] = convertGPSToLocal(windmill, userLocation);
      const bearing = Math.atan2(z, x); // Keep in radians for getCardinalDirection
      const normalizedBearing = (bearing * 180 / Math.PI + 360) % 360;
      return {
        id: windmill.id,
        x, z,
        bearing: normalizedBearing,
        direction: getCardinalDirection(bearing) // Pass bearing in radians
      };
    });

    // All test turbines should be in western quadrants
    positions.forEach(pos => {
      expect(['W', 'SW', 'NW'].includes(pos.direction)).toBe(true);
      expect(pos.x).toBeLessThan(0); // South of user (negative X)
      expect(pos.z).toBeLessThan(0); // West of user (negative Z)
    });
  });

  test('should handle coordinate precision edge cases', () => {
    // Test very small coordinate differences (precision limits)
    const nearbyLocation = {
      latitude: userLocation.latitude + 0.000001, // ~0.1m difference
      longitude: userLocation.longitude + 0.000001,
      altitude: userLocation.altitude
    };

    const [x, y, z] = convertGPSToLocal(nearbyLocation, userLocation);
    const distance = calculateDistance(userLocation, nearbyLocation);

    expect(Math.abs(x)).toBeLessThan(1); // Less than 1m
    expect(Math.abs(z)).toBeLessThan(1); // Less than 1m  
    expect(distance).toBeLessThan(1); // Less than 1m total distance
  });
});