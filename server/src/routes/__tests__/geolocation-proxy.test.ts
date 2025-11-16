import request from 'supertest';
import express from 'express';
import stateRouter from '../state.js';
import { jest } from '@jest/globals';

// Mock global fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as any;

describe('Geolocation Proxy Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/api', stateRouter);
    mockFetch.mockClear();
  });

  it('should proxy geolocation request for public IP', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        city: 'Mountain View',
        region: 'California',
        country: 'United States',
        country_code: 'US'
      })
    } as Response);

    const response = await request(app)
      .get('/api/geolocation/8.8.8.8')
      .expect(200);

    expect(response.body).toEqual({
      city: 'Mountain View',
      region: 'California',
      country: 'United States',
      countryCode: 'US'
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      'https://get.geojs.io/v1/ip/geo/8.8.8.8.json'
    );
  });

  it('should return mock data for private IPs', async () => {
    const response = await request(app)
      .get('/api/geolocation/192.168.1.1')
      .expect(200);

    expect(response.body).toEqual({
      city: 'Local',
      region: 'Private',
      country: 'Network',
      countryCode: 'XX'
    });

    // Verify fetch was NOT called for private IPs
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle geolocation service errors gracefully', async () => {
    // Mock failed fetch response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    } as Response);

    const response = await request(app)
      .get('/api/geolocation/invalid-ip')
      .expect(200);

    expect(response.body).toEqual({
      error: 'Failed to fetch geolocation'
    });

    // Verify fetch was attempted
    expect(mockFetch).toHaveBeenCalledWith(
      'https://get.geojs.io/v1/ip/geo/invalid-ip.json'
    );
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error (ECONNREFUSED, etc.)
    mockFetch.mockRejectedValueOnce(
      new Error('ECONNREFUSED')
    );

    const response = await request(app)
      .get('/api/geolocation/1.2.3.4')
      .expect(200);

    expect(response.body).toEqual({
      error: 'Failed to fetch geolocation'
    });
  });
});
