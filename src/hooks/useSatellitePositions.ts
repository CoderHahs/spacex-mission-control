import { useState, useEffect, useCallback, useRef } from 'react';
import type { Satellite, SatellitePosition } from '@/types';
import { calculateSatellitePosition } from '@/services/satelliteApi';

export function useSatellitePositions(satellites: Satellite[], updateInterval = 1000) {
  const [positions, setPositions] = useState<Map<string, SatellitePosition>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePositions = useCallback(() => {
    const newPositions = new Map<string, SatellitePosition>();
    const now = new Date();

    satellites.forEach((satellite) => {
      const position = calculateSatellitePosition(satellite.tle, now);
      if (position) {
        newPositions.set(satellite.id, position);
      }
    });

    setPositions(newPositions);
  }, [satellites]);

  useEffect(() => {
    updatePositions();
    
    intervalRef.current = setInterval(updatePositions, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updatePositions, updateInterval]);

  return positions;
}
