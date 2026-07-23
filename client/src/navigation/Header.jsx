import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { parentNavigation } from '../config/parentNavigation';
import { endParentSession } from '../utils/session';
import './navigation.css';

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
    <nav className="issa-header relative z-50 mx-auto w-[min(calc(100%-2rem),var(--issa-container))] overflow-hidden border px-2 py-2.5 shadow-[var(--issa-shadow)] sm:px-4 md:min-h-[4.55rem] md:px-[0.8rem] md:py-[0.55rem] min-[900px]:min-h-[3.8rem] min-[900px]:px-[0.7rem] min-[900px]:py-[0.45rem]">
      <div className="relative z-10 flex flex-wrap items-center justify-between">
        <NavLink to="/" className="issa-header__brand relative ml-2 flex items-center justify-center" aria-label="Ringkasan ISSA">
          <img
            src="https://live.staticflickr.com/65535/52735891608_e4bb396871_w.jpg"
            className="relative z-10 h-7 sm:h-9"
            alt="ISSA"
          />
          <span className="issa-header__brand-mark" aria-hidden="true">ISSA</span>
        </NavLink>

        <ul className="hidden items-center gap-1 md:order-1 md:flex md:px-[0.65rem] min-[900px]:px-[0.2rem]">
          {parentNavigation.map((navigationItem) => (
            <li key={navigationItem.path}>
              <NavLink
                to={navigationItem.path}
                end={navigationItem.end}
                className={({ isActive }) => `issa-header__link relative block rounded-[var(--issa-radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--issa-text-secondary)] transition-[transform,color,background] duration-[180ms] md:rounded-none md:px-[0.82rem] md:py-[0.8rem] md:text-[0.78rem] md:tracking-[0.015em] min-[900px]:px-[0.72rem] min-[900px]:py-[0.62rem] ${isActive ? 'is-active' : ''}`}
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
            className="issa-header__profile relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border"
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
              className="absolute right-0 top-11 z-50 w-52 rounded-[var(--issa-radius-sm)] border border-[var(--issa-border)] bg-[var(--issa-surface)] text-base shadow-[var(--issa-shadow)]"
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
