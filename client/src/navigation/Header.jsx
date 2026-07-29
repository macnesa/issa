import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { parentNavigation } from '../config/parentNavigation';
import { endParentSession, isParentDemoSession } from '../utils/session';

function desktopLinkClass({ isActive }) {
  return [
    'relative flex min-h-[2.75rem] items-center justify-center',
    'whitespace-nowrap px-3.5',
    'rounded-[0.42rem_0.42rem_0.82rem_0.42rem]',
    'text-[0.8rem] font-semibold tracking-[0.006em]',
    'transition-colors duration-150',
    'focus-visible:z-10 focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-[#9555c2]',
    'focus-visible:ring-offset-1',
    'focus-visible:ring-offset-[#fffdf8]',
    'motion-reduce:transition-none',
    isActive
      ? [
          'bg-[#eee6f6]',
          'text-[#684087]',
          'shadow-[inset_0_-2px_0_rgba(149,85,194,0.55)]',
        ].join(' ')
      : [
          'text-[#566872]',
          'hover:bg-[#fff3cb]',
          'hover:text-[#173e52]',
        ].join(' '),
  ].join(' ');
}

function StudentAvatar({ imageUrl, name }) {
  const initial =
    typeof name === 'string' && name.trim()
      ? name.trim().charAt(0).toUpperCase()
      : 'S';

  return (
    <span
      className={[
        'block h-10 w-10 shrink-0 overflow-hidden',
        'rounded-[0.58rem_0.58rem_0.58rem_0.22rem]',
        'border-2 border-[#65aaa7]',
        'bg-[#dcefed]',
      ].join(' ')}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name ? `Foto ${name}` : 'Profil siswa'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={[
            'flex h-full w-full items-center justify-center',
            'text-sm font-bold text-[#173e52]',
          ].join(' ')}
        >
          {initial}
        </span>
      )}
    </span>
  );
}

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const location = useLocation();
  const profileAreaRef = useRef(null);
  const profileButtonRef = useRef(null);

  const profile = useSelector(
    (state) => state.student?.studentDetail?.data?.profile,
  );

  const imageUrl = profile?.imageUrl ?? '';
  const name = profile?.name ?? 'Siswa';
  const nim = profile?.nim ?? '';
  const isDemo = isParentDemoSession();

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        profileAreaRef.current &&
        !profileAreaRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') {
        return;
      }

      setIsProfileMenuOpen(false);
      profileButtonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleSignOut() {
    setIsProfileMenuOpen(false);
    endParentSession('manual');
  }

  return (
    <header className="relative z-50">
      <nav
        aria-label="Navigasi utama orang tua"
        className={[
          'issa-header',
          'w-full overflow-visible',
          'border-0 bg-transparent shadow-none',
          'lg:mx-auto',
          'lg:max-w-[var(--issa-container)]',
          'lg:rounded-[0.68rem_0.68rem_1.45rem_0.48rem]',
          'lg:border lg:border-[#173e52]',
          'lg:bg-[#fffdf8]',
          'lg:shadow-[4px_4px_0_rgba(23,62,82,0.08)]',
        ].join(' ')}
      >
        <div
          className={[
            'grid min-h-14 items-center',
            'grid-cols-[4.75rem_minmax(0,1fr)_4.75rem]',
            'px-4',
            'lg:min-h-[4rem]',
            'lg:grid-cols-[7rem_minmax(0,1fr)_7rem]',
            'lg:px-3',
          ].join(' ')}
        >
          {/* Brand */}
          <NavLink
            to="/"
            aria-label="Buka Ringkasan ISSA"
            className={[
              'flex h-10 items-center justify-start',
              'focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[#9555c2]',
              'focus-visible:ring-offset-2',
              'focus-visible:ring-offset-transparent',
              'lg:rounded-[0.35rem]',
              'lg:px-2',
              'lg:focus-visible:ring-offset-[#fffdf8]',
            ].join(' ')}
          >
            <img
              src="/issa-logo.png"
              alt=""
              className="h-7 w-7 max-w-full bg-[#173e52] p-0.5 object-contain lg:h-8 lg:w-8"
            />
          </NavLink>

          {/* Desktop navigation */}
          <ul className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
            {parentNavigation.map((navigationItem) => (
              <li key={navigationItem.path} className="shrink-0">
                <NavLink
                  to={navigationItem.path}
                  end={navigationItem.end}
                  className={desktopLinkClass}
                >
                  {navigationItem.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Seamless mobile/tablet center */}
          <div aria-hidden="true" className="lg:hidden" />

          {/* Profile */}
          <div
            ref={profileAreaRef}
            className="relative flex justify-end"
          >
            {isDemo && (
              <div className="absolute right-[3.2rem] top-1/2 flex -translate-y-1/2 flex-col items-end whitespace-nowrap text-right">
                <span className="text-[0.61rem] font-extrabold uppercase tracking-[0.08em] text-[#684087]">
                  Mode demo
                </span>
                <span className="hidden text-[0.58rem] font-semibold text-[#71818a] sm:block">
                  Akses hanya-baca
                </span>
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
              className={[
                'rounded-[0.62rem_0.62rem_0.62rem_0.24rem]',
                'transition-opacity duration-150',
                'hover:opacity-80',
                'focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[#9555c2]',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-transparent',
                'lg:focus-visible:ring-offset-[#fffdf8]',
                'motion-reduce:transition-none',
              ].join(' ')}
            >
              <StudentAvatar imageUrl={imageUrl} name={name} />
            </button>

            {isProfileMenuOpen && (
              <div
                id="parent-profile-menu"
                role="menu"
                className={[
                  'absolute right-0 top-[calc(100%+0.65rem)] z-[60]',
                  'w-[min(15rem,calc(100vw-2rem))]',
                  'overflow-hidden',
                  'rounded-[0.45rem_0.45rem_1rem_0.45rem]',
                  'border border-[#173e52]',
                  'bg-[#fffdf8]',
                  'shadow-[4px_4px_0_rgba(23,62,82,0.11)]',
                ].join(' ')}
              >
                <div className="border-b border-[#d3e0e5] px-4 py-3.5">
                  <span className="block text-[0.65rem] font-bold uppercase tracking-[0.11em] text-[#71818a]">
                    Siswa terhubung
                  </span>

                  <span className="mt-1 block truncate text-sm font-bold text-[#173e52]">
                    {name}
                  </span>

                  {nim && (
                    <span className="mt-0.5 block truncate text-xs font-medium text-[#71818a]">
                      {nim}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className={[
                    'flex w-full items-center justify-between',
                    'px-4 py-3.5 text-left',
                    'text-sm font-semibold text-[#596b74]',
                    'transition-colors duration-150',
                    'hover:bg-[#fff0ed]',
                    'hover:text-[#963f38]',
                    'focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-inset',
                    'focus-visible:ring-[#963f38]',
                    'motion-reduce:transition-none',
                  ].join(' ')}
                >
                  <span>Keluar</span>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 8l4 4m0 0-4 4m4-4H9m3 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"
                    />
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
