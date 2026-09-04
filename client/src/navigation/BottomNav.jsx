import { Link, useLocation } from 'react-router-dom';
import { isParentNavigationActive, parentNavigation } from '../config/parentNavigation';

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav aria-label="Navigasi utama" className="parent-bottom-nav">
      <div className="parent-bottom-nav__grid">
        {parentNavigation.map((navigationItem) => {
          const isActive = isParentNavigationActive(navigationItem, location.pathname);
          return (
            <Link
              key={navigationItem.path}
              to={navigationItem.path}
              aria-current={isActive ? 'page' : undefined}
              className={`parent-bottom-nav__link${isActive ? ' parent-bottom-nav__link--active' : ''}`}
            >
              <NavigationIcon path={navigationItem.path} />
              <span>{navigationItem.shortLabel || navigationItem.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavigationIcon({ path }) {
  const paths = {
    '/': 'M10 2a8 8 0 100 16 8 8 0 000-16zm0 3a1 1 0 011 1v3.4l2.3 1.35a1 1 0 11-1 1.73l-2.8-1.63A1 1 0 019 10V6a1 1 0 011-1z',
    '/journey': 'M4 3a1 1 0 011 1v1h6V4a1 1 0 112 0v1h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1V4a1 1 0 011-1zm2 5h8v2H6V8zm0 4h5v2H6v-2z',
    '/schedule': 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h12v5H4v-5z',
  };

  return (
    <svg className="parent-bottom-nav__icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d={paths[path] || paths['/']} />
    </svg>
  );
}
