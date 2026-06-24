'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSession, clearSession } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface LayoutProps {
  children: React.ReactNode;
  title?: string; subtitle?: string;
  classified?: boolean;
  maxWidth?: 'sm'|'md'|'lg'|'xl'|'2xl'|'full';
}

export default function Layout({ children, title, subtitle, classified=false, maxWidth='xl' }: LayoutProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => { setSession(getSession()); }, []);
  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const mw = { sm:'max-w-sm', md:'max-w-2xl', lg:'max-w-4xl', xl:'max-w-6xl', '2xl':'max-w-7xl', full:'max-w-full' }[maxWidth];

  const navLinks = [
    { href: '/lore',     label: t('nav_lore'),     show: true },
    { href: '/moonfall', label: t('nav_incident'),  show: true },
    { href: '/apply',    label: t('nav_apply'),     show: true },
    { href: '/access',   label: t('nav_access'),    show: true },
    { href: '/dashboard', label: 'DASHBOARD',       show: !!session },
    { href: `/profile/${session?.id}`, label: t('nav_profile'), show: !!session },
    { href: '/tasks',    label: t('nav_tasks'),     show: !!session },
    { href: '/admin/tasks', label: t('nav_taskops'), show: pathname.startsWith('/admin') },
  ].filter(l => l.show);

  return (
    <div className="min-h-screen flex flex-col pb-6">
      <nav className="border-b border-border bg-surface/60 backdrop-blur sticky top-7 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-mono text-xs text-accent hover:text-text transition-colors tracking-widest uppercase flex-shrink-0">
            {t('nav_mcb')}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4 font-mono text-[10px] text-text-muted tracking-widest">
            {navLinks.map(l => (
              <NavLink key={l.href} href={l.href} label={l.label}
                active={l.href === '/dashboard' ? pathname === '/dashboard' : l.href.includes('/profile') ? pathname.startsWith('/profile') : l.href.includes('/tasks') && !l.href.includes('admin') ? pathname.startsWith('/tasks') : pathname === l.href || pathname.startsWith(l.href + '/')} />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Logout — desktop */}
            {session && (
              <button
                onClick={() => { clearSession(); window.location.href = '/access'; }}
                className="hidden md:block font-mono text-[10px] text-text-muted hover:text-red-400 transition-colors tracking-widest"
              >
                {t('nav_logout')}
              </button>
            )}

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden flex flex-col gap-1 p-1.5 group"
              aria-label="Toggle navigation"
            >
              <span className={`block w-5 h-px bg-text-muted transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block w-5 h-px bg-text-muted transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-px bg-text-muted transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-surface/95 backdrop-blur">
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
              {navLinks.map(l => {
                const isActive = l.href === '/dashboard' ? pathname === '/dashboard' : pathname === l.href || pathname.startsWith(l.href + '/');
                return (
                  <Link key={l.href} href={l.href}
                    className={`block font-mono text-[11px] tracking-widest py-2 px-3 transition-colors ${isActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text hover:bg-surface'}`}
                  >
                    {isActive ? `[${l.label}]` : l.label}
                  </Link>
                );
              })}
              {session && (
                <button
                  onClick={() => { clearSession(); window.location.href = '/access'; }}
                  className="w-full text-left font-mono text-[11px] tracking-widest py-2 px-3 text-text-muted hover:text-red-400 transition-colors"
                >
                  {t('nav_logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {(title || subtitle) && (
        <div className={`${mw} mx-auto w-full px-4 sm:px-6 pt-8 pb-4`}>
          {classified && <div className="mb-3"><span className="classified-stamp">CLASSIFIED</span></div>}
          {title && (
            <h1 className="mcb-title">
              <span className="text-accent/60 font-mono text-sm block mb-1">// {subtitle ?? 'RECORD'}</span>
              {title}
            </h1>
          )}
          <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
        </div>
      )}

      <div className={`${mw} mx-auto w-full px-4 sm:px-6 flex-1`}>{children}</div>
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`transition-colors tracking-widest ${active ? 'text-accent' : 'hover:text-text'}`}>
      {active ? `[${label}]` : label}
    </Link>
  );
}
