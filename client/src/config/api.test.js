import { resolveApiBaseUrl } from './api';

describe('Parent API base URL', () => {
  test('uses the canonical API for the deployed Parent domain', () => {
    expect(resolveApiBaseUrl({
      configuredApiBaseUrl: '',
      location: {
        hostname: 'issa.macnesa.com',
        origin: 'https://issa.macnesa.com',
      },
    })).toBe('https://issa-api.macnesa.com');
  });

  test('preserves configured local and preview API targets', () => {
    expect(resolveApiBaseUrl({
      configuredApiBaseUrl: 'http://localhost:3000/',
      location: {
        hostname: 'localhost',
        origin: 'http://localhost:3100',
      },
    })).toBe('http://localhost:3000');
  });
});
