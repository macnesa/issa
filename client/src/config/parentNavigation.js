export const parentNavigation = [
  { label: 'Hari ini', path: '/', end: true, activePrefixes: ['/'] },
  { label: 'Perjalanan', path: '/journey', activePrefixes: ['/journey', '/attendance', '/progress'] },
  { label: 'Jadwal', path: '/schedule', activePrefixes: ['/schedule'] },
];

export function isParentNavigationActive(navigationItem, pathname) {
  if (!navigationItem || typeof pathname !== 'string') return false;
  if (navigationItem.end) return pathname === navigationItem.path;
  return (navigationItem.activePrefixes || [navigationItem.path]).some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}
