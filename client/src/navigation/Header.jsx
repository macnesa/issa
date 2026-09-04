import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isParentNavigationActive, parentNavigation } from '../config/parentNavigation';
import { endParentSession, isParentDemoSession } from '../utils/session';

function StudentAvatar({ imageUrl, name }) {
  const initial = typeof name === 'string' && name.trim()
    ? name.trim().charAt(0).toUpperCase()
    : 'S';

  return (
    <span className="parent-profile__avatar">
      {imageUrl ? (
        <img src={imageUrl} alt={name ? `Foto ${name}` : 'Profil siswa'} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const profileAreaRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profile = useSelector((state) => state.student?.studentDetail?.data?.profile);
  const imageUrl = profile?.imageUrl ?? '';
  const name = profile?.name ?? 'Siswa';
  const nim = profile?.nim ?? '';
  const isDemo = isParentDemoSession();

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (profileAreaRef.current && !profileAreaRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape' || !isProfileMenuOpen) return;
      setIsProfileMenuOpen(false);
      profileButtonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  function handleSignOut() {
    setIsProfileMenuOpen(false);
    endParentSession('manual');
  }

  return (
    <header className="parent-header">
      <nav aria-label="Navigasi utama orang tua" className="issa-header">
        <div className="issa-header__grid">
          <Link to="/" aria-label="Buka Hari ini ISSA" className="issa-header__brand">
            <img src="/issa-logo.png" alt="" />
          </Link>

          <ul className="parent-nav">
            {parentNavigation.map((navigationItem) => {
              const isActive = isParentNavigationActive(navigationItem, location.pathname);
              return (
                <li key={navigationItem.path}>
                  <Link
                    to={navigationItem.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`parent-nav__link${isActive ? ' parent-nav__link--active' : ''}`}
                  >
                    {navigationItem.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div ref={profileAreaRef} className="parent-profile">
            {isDemo && (
              <div className="parent-profile__demo">
                <strong>Mode demo</strong>
                <span>Akses hanya-baca</span>
              </div>
            )}
            <button
              ref={profileButtonRef}
              type="button"
              aria-expanded={isProfileMenuOpen}
              aria-controls="parent-profile-menu"
              aria-haspopup="menu"
              aria-label={`Buka menu profil ${name}`}
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className="parent-profile__button"
            >
              <StudentAvatar imageUrl={imageUrl} name={name} />
            </button>

            {isProfileMenuOpen && (
              <div id="parent-profile-menu" role="menu" className="parent-profile__menu">
                <div className="parent-profile__identity">
                  <span>Siswa terhubung</span>
                  <strong>{name}</strong>
                  {nim && <small>{nim}</small>}
                </div>
                <button type="button" role="menuitem" onClick={handleSignOut} className="parent-profile__signout">
                  <span>Keluar</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 8l4 4m0 0-4 4m4-4H9m3 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
