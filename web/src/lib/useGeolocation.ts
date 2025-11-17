import { useState, useEffect } from 'react';
import { API_BASE_URL } from './api';

interface GeolocationData {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  loading: boolean;
  error?: string;
}

interface GeolocationResponse {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  error?: string;
}

/**
 * Hook to fetch geolocation data from IP address via backend proxy
 * Proxied through backend to avoid HTTPS mixed content issues
 *
 * @param ipAddress - The IP address to lookup
 * @returns GeolocationData with city, region, country info
 */
export function useGeolocation(ipAddress: string | null): GeolocationData {
  const [data, setData] = useState<GeolocationData>({ loading: true });

  useEffect(() => {
    if (!ipAddress) {
      setData({ loading: false, error: 'No IP address provided' });
      return;
    }

    const fetchGeolocation = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE_URL}/geolocation/${ipAddress}`);
        const result = (await response.json()) as GeolocationResponse;

        if (result.error) {
          setData({
            loading: false,
            error: result.error,
          });
        } else {
          setData({
            loading: false,
            city: result.city,
            region: result.region,
            country: result.country,
            countryCode: result.countryCode,
          });
        }
      } catch (err) {
        setData({
          loading: false,
          error: 'Failed to fetch geolocation',
        });
      }
    };

    void fetchGeolocation();
  }, [ipAddress]);

  return data;
}
