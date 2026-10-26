import type { Turf } from '@/modules/shared/database/types';

export interface WeatherAlert {
  active: boolean;
  type: 'rain' | 'thunderstorm' | 'clear';
  title: string;
  description: string;
  rainRefundGuaranteed: boolean;
}

/**
 * Checks if a turf is an open-air outdoor turf without an all-weather roof.
 */
export function isOutdoorTurf(turf: Pick<Turf, 'amenities'>): boolean {
  return !turf.amenities.some((a) => /covered|indoor/i.test(a));
}

/**
 * Returns weather advisory and rain policy guarantee for a turf.
 * In coastal Mangalore, outdoor turfs are subject to sudden tropical monsoon downpours.
 */
export function getWeatherAlert(turf: Pick<Turf, 'amenities'>): WeatherAlert {
  const outdoor = isOutdoorTurf(turf);
  if (!outdoor) {
    return {
      active: false,
      type: 'clear',
      title: 'Indoor/Covered Pitch',
      description: 'Matches are sheltered from rain and weather disruptions.',
      rainRefundGuaranteed: false,
    };
  }

  return {
    active: true,
    type: 'rain',
    title: 'Monsoon Rain Protection Active',
    description:
      'This is an open outdoor pitch. In case of heavy rain or waterlogging, 100% full wallet refund is guaranteed under the OYUN Rain Policy.',
    rainRefundGuaranteed: true,
  };
}
