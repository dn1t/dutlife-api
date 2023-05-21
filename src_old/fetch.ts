import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

export const cookieJar = new CookieJar();
const originalFetch = globalThis.fetch;

globalThis.fetch = fetchCookie(
  (input: URL | Request | string, init?: RequestInit) => {
    const headers: HeadersInit = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      ...init?.headers,
    };

    return originalFetch(input, { ...init, headers });
  },
  cookieJar,
);
