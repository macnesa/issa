import { resolveApiBaseUrl } from './api';

describe('CMS API base URL', () => {
  test('uses the canonical API for the deployed CMS domain', () => {
    expect(resolveApiBaseUrl({
      configuredApiBaseUrl: '',
      location: {
        hostname: 'issa-cms.macnesa.com',
        origin: 'https://issa-cms.macnesa.com',
      },
    })).toBe('https://issa-api.macnesa.com');
  });

  test('preserves configured local and preview API targets', () => {
    expect(resolveApiBaseUrl({
      configuredApiBaseUrl: 'http://localhost:3000/',
      location: {
        hostname: 'localhost',
        origin: 'http://localhost:3001',
      },
    })).toBe('http://localhost:3000');
  });
});
