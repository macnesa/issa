import { NavLink } from 'react-router-dom';
import { parentNavigation } from '../config/parentNavigation';

export default function BottomNav() {
  return (
    <nav aria-label="Navigasi utama" className="parent-bottom-nav">
      <div className="parent-bottom-nav__grid">
        {parentNavigation.map((navigationItem) => (
          <NavLink
            key={navigationItem.path}
            to={navigationItem.path}
            end={navigationItem.end}
            className={({ isActive }) => (
              `parent-bottom-nav__link${isActive ? ' parent-bottom-nav__link--active' : ''}`
            )}
          >
            <NavigationIcon path={navigationItem.path} />
            <span>{navigationItem.shortLabel || navigationItem.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function NavigationIcon({ path }) {
  const paths = {
    '/': 'M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003.707 10.7L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z',
    '/attendance': 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 100 2h8a1 1 0 100-2H6z',
    '/progress': 'M3 3a1 1 0 000 2v10a2 2 0 002 2h12a1 1 0 100-2H5V5a1 1 0 00-2-2zm12 4a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1zM10 9a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1zM6 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z',
    '/schedule': 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h12v5H4v-5z',
    '/activities': 'M10 2a8 8 0 100 16 8 8 0 000-16zm1 4v4l3 2-1 1-4-2V6h2z',
  };

  return (
    <svg className="parent-bottom-nav__icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d={paths[path]} />
    </svg>
  );
}
