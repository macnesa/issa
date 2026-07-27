import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { parentNavigation } from '../config/parentNavigation';
import { endParentSession } from '../utils/session';
const headerStyles = String.raw`
.issa-header {
  border-color: #c8dce7;
  border-radius: 1rem 1rem 1.8rem 1rem;
  background: linear-gradient(105deg, rgba(255, 255, 255, 0.98), rgba(234, 246, 248, 0.92));
}

.issa-header__link::after {
  content: none;
}

.issa-header__link.is-active {
  border-radius: 0.75rem 0.4rem 0.75rem 0.4rem;
  background: #e9ddfa;
  color: #684087;
  transform: translateY(-1px);
}

.issa-header__link:hover {
  background: #fff4c8;
  color: #695d2a;
}

.issa-header__profile {
  border-width: 2px;
  border-color: #6bbfbc;
  box-shadow: 0.18rem 0.18rem 0 #f2e291;
}

@media (min-width: 768px) {
  .issa-header {
    border-width: 2px 1px 1px 2px;
    border-color: #173e52;
    border-radius: 0.72rem 0.72rem 2.25rem 0.42rem;
    background: linear-gradient(105deg, rgba(255, 255, 255, 0.98), rgba(234, 246, 248, 0.94));
    box-shadow: 0.48rem 0.52rem 0 rgba(23, 62, 82, 0.11);
  }

  .issa-header__brand {
    width: 8.45rem;
    height: 3.15rem;
    margin-left: 0.05rem;
    padding: 0.35rem 0.7rem;
    border: 1px solid rgba(23, 62, 82, 0.2);
    border-radius: 0.58rem 0.58rem 1.15rem 0.3rem;
    background: rgba(255, 255, 255, 0.72);
  }

  .issa-header__brand img {
    width: 6.4rem;
    max-height: 1.7rem;
    object-fit: contain;
  }

  .issa-header__link::after {
    position: absolute;
    right: 0.82rem;
    bottom: 0.42rem;
    left: 0.82rem;
    height: 0.18rem;
    border-radius: 999px;
    background: #9555c2;
    content: "";
    opacity: 0;
    transform: scaleX(0.35);
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .issa-header__link.is-active {
    border-radius: 0.7rem 0.22rem 0.7rem 0.22rem;
    background: rgba(233, 221, 250, 0.68);
    box-shadow: inset 0 1px 0 rgba(149, 85, 194, 0.12);
    color: #684087;
    transform: none;
  }

  .issa-header__link.is-active::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .issa-header__link:hover {
    background: rgba(255, 244, 200, 0.68);
  }

  .issa-header__profile {
    width: 2.72rem;
    height: 2.72rem;
    border-radius: 0.78rem 0.78rem 0.78rem 0.28rem;
    background: #f8ffff;
    box-shadow: 0.22rem 0.24rem 0 #f2e291;
  }

}

@media (min-width: 900px) {
  .issa-header {
    border-radius: 0.68rem 0.68rem 1.65rem 0.38rem;
    box-shadow: 0.22rem 0.25rem 0 rgba(23, 62, 82, 0.08);
  }

  .issa-header__brand {
    width: 5rem;
    height: 2.35rem;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .issa-header__brand img {
    width: 4.4rem;
    max-height: 1.55rem;
  }

  .issa-header__profile {
    width: 2.45rem;
    height: 2.45rem;
    border-radius: 0.65rem 0.65rem 0.65rem 0.26rem;
    box-shadow: none;
  }

  .issa-header__link.is-active {
    box-shadow: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .issa-header__link {
    transition: none;
    animation: none;
  }
}
`;

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
    <>
      <style>{headerStyles}</style>
      <nav className="issa-header relative z-50 mx-auto w-[min(calc(100%-2rem),var(--issa-container))] overflow-hidden border px-2 py-2.5 shadow-[var(--issa-shadow)] sm:px-4 md:min-h-[4.55rem] md:px-[0.8rem] md:py-[0.55rem] min-[900px]:min-h-[3.8rem] min-[900px]:px-[0.7rem] min-[900px]:py-[0.45rem]">
      <div className="relative z-10 flex flex-wrap items-center justify-between">
        <NavLink to="/" className="issa-header__brand relative ml-2 flex items-center justify-center" aria-label="Ringkasan ISSA">
          <img
            src="https://live.staticflickr.com/65535/52735891608_e4bb396871_w.jpg"
            className="relative z-10 h-7 sm:h-9"
            alt="ISSA"
          />
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
    </>
  );
}
