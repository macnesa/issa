import { NavLink } from 'react-router-dom';
import { parentNavigation } from '../config/parentNavigation';

export default function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-4 left-1/2 z-50 h-16 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-[1.25rem_1.25rem_1.7rem_1.25rem] border border-[#173e52] bg-[linear-gradient(120deg,#133b4f,#245b70)] shadow-[0_0.8rem_1.8rem_rgba(14,42,58,0.25)] md:hidden"
    >
      <div className="mx-auto grid h-full grid-cols-5">
        {parentNavigation.map((navigationItem) => (
          <NavLink
            key={navigationItem.path}
            to={navigationItem.path}
            end={navigationItem.end}
            className={({ isActive }) => `relative z-[1] inline-flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-[0.85rem_0.85rem_0.55rem_0.55rem] px-1 text-[10px] font-semibold text-[rgba(255,255,255,0.67)] transition-[color,background,transform] duration-[180ms] motion-reduce:transition-none motion-reduce:animate-none ${isActive ? 'mx-[0.2rem] my-[0.35rem] -translate-y-[0.2rem] bg-[#f2e291] text-[#173e52]' : ''}`}
          >
            <NavigationIcon path={navigationItem.path} />
            <span>{navigationItem.label}</span>
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
    <svg className="w-5 h-5 mb-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d={paths[path]} />
    </svg>
  );
}
