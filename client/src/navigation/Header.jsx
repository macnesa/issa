import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { parentNavigation } from '../config/parentNavigation';
import { endParentSession } from '../utils/session';

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const {
    student: { studentDetail: studentDetailResource },
  } = useSelector((state) => state);
  const { imageUrl, name, nim } = studentDetailResource.data.profile;
  function handleSignOut() {
    endParentSession('manual');
  }

  return (
    <nav className="app-header issa-header relative z-50 px-2 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-center justify-between">
        <NavLink to="/" className="issa-header__brand ml-2 flex items-center justify-center" aria-label="Ringkasan ISSA">
          <img
            src="https://live.staticflickr.com/65535/52735891608_e4bb396871_w.jpg"
            className="h-7 sm:h-9"
            alt="ISSA"
          />
          <span className="issa-header__brand-mark" aria-hidden="true">ISSA</span>
        </NavLink>

        <ul className="hidden items-center gap-1 md:order-1 md:flex">
          {parentNavigation.map((navigationItem) => (
            <li key={navigationItem.path}>
              <NavLink
                to={navigationItem.path}
                end={navigationItem.end}
                className={({ isActive }) => `app-nav-link issa-header__link block px-3 py-2 text-sm ${isActive ? 'is-active' : ''}`}
              >
                {navigationItem.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="relative flex items-center md:order-2">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            aria-expanded={isProfileMenuOpen}
            aria-controls="parent-profile-menu"
            className="issa-header__profile h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-[var(--issa-border)]"
          >
            {imageUrl ? (
              <img className="w-full h-full object-cover" src={imageUrl} alt="Profil siswa" />
            ) : (
              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-[var(--issa-primary-soft)]">
                <svg className="absolute -left-1 h-10 w-10 text-[var(--issa-text-muted)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
            )}
          </button>

          {isProfileMenuOpen && (
            <div
              id="parent-profile-menu"
              className="profile-menu absolute right-0 top-11 z-50 w-52 text-base"
            >
              <div className="border-b border-[var(--issa-border)] px-4 py-3">
                <span className="block text-sm font-semibold text-[var(--issa-text)]">{name}</span>
                <span className="block truncate text-sm text-[var(--issa-text-muted)]">{nim}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-[var(--issa-text-secondary)] hover:bg-[var(--issa-primary-soft)] hover:text-[var(--issa-primary)]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
