import type { DirectionsResponse, EventsResponse } from '../types/ferry';

const BASE_URL = 'https://www.praamid.ee/online';
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

async function fetchWithCorsProxy(url: string): Promise<Response> {
  try {
    // Try direct fetch first
    const response = await fetch(url);
    if (response.ok) {
      return response;
    }
    throw new Error('Direct fetch failed');
  } catch (error) {
    console.log('Direct fetch failed, trying CORS proxy...', error);
    // Fallback to CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const proxyResponse = await fetch(proxyUrl);

    if (!proxyResponse.ok) {
      throw new Error(`CORS proxy failed: ${proxyResponse.status}`);
    }

    const proxyData = await proxyResponse.json();
    // Create a mock Response object with the contents
    return {
      ok: true,
      json: async () => JSON.parse(proxyData.contents),
    } as Response;
  }
}

export async function getDirections(): Promise<DirectionsResponse> {
  try {
    const response = await fetchWithCorsProxy(`${BASE_URL}/directions`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw new Error('Failed to fetch ferry directions');
  }
}

export async function getEvents(
  direction: string,
  departureDate: string,
  timeShift = 300
): Promise<EventsResponse> {
  try {
    const params = new URLSearchParams({
      direction,
      'departure-date': departureDate,
      'time-shift': timeShift.toString(),
    });

    const url = `${BASE_URL}/events?${params}`;
    const response = await fetchWithCorsProxy(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch ferry events');
  }
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}
