import { isParentNavigationActive, parentNavigation } from './parentNavigation';

const byLabel = (label) => parentNavigation.find((item) => item.label === label);

describe('Parent navigation ownership', () => {
  it('keeps contextual attendance and assessment details owned by Perjalanan', () => {
    const journey = byLabel('Perjalanan');
    expect(isParentNavigationActive(journey, '/journey')).toBe(true);
    expect(isParentNavigationActive(journey, '/attendance')).toBe(true);
    expect(isParentNavigationActive(journey, '/progress')).toBe(true);
    expect(isParentNavigationActive(journey, '/progress/7')).toBe(true);
  });

  it('does not make Hari ini active on every route', () => {
    const today = byLabel('Hari ini');
    expect(isParentNavigationActive(today, '/')).toBe(true);
    expect(isParentNavigationActive(today, '/journey')).toBe(false);
  });
});
