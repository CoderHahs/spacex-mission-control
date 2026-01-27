import { useState, useEffect, useCallback } from 'react';
import { formatCountdown } from '@/lib/utils';

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function useCountdown(targetDate: string | Date): CountdownValues {
  const calculateCountdown = useCallback(() => {
    return formatCountdown(targetDate);
  }, [targetDate]);

  const [countdown, setCountdown] = useState<CountdownValues>(calculateCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateCountdown]);

  return countdown;
}
