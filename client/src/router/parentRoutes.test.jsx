import { act } from '@testing-library/react';
import { createMemoryRouter } from 'react-router-dom';
import { parentRoutes } from './index';

vi.mock('../utils/session', () => ({ hasParentSession: () => true }));

describe('Parent compatibility routes', () => {
  it.each([
    ['/lesson/6', '/progress/6'], ['/activities', '/schedule'], ['/total', '/progress'],
    ['/attendance', '/attendance'], ['/progress', '/progress'], ['/progress/6', '/progress/6'],
  ])('%s resolves to %s', async (from, to) => {
    const router = createMemoryRouter(parentRoutes, { initialEntries: ['/'] });
    await act(async () => router.navigate(from));
    expect(router.state.location.pathname).toBe(to);
    router.dispose();
  });
});
