import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatCountdown(targetDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'Go': 'bg-green-500',
    'TBD': 'bg-yellow-500',
    'Hold': 'bg-orange-500',
    'Success': 'bg-green-500',
    'Failure': 'bg-red-500',
    'In Flight': 'bg-blue-500',
    'Partial Failure': 'bg-orange-500',
  };
  return statusColors[status] || 'bg-gray-500';
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    'SpaceX': '#005288',
    'NASA': '#FC3D21',
    'Rocket Lab': '#000000',
    'Blue Origin': '#005BAC',
    'Roscosmos': '#C8102E',
    'CNSA': '#DE2910',
    'ISRO': '#FF9933',
    'ESA': '#003399',
    'ULA': '#1B365D',
    'Arianespace': '#00AEEF',
  };
  return colors[provider] || '#6B7280';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'communication': '#3B82F6',
    'weather': '#10B981',
    'navigation': '#F59E0B',
    'scientific': '#8B5CF6',
    'military': '#EF4444',
    'earth-observation': '#06B6D4',
    'iss': '#EC4899',
    'starlink': '#6366F1',
    'other': '#6B7280',
  };
  return colors[category] || '#6B7280';
}

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
