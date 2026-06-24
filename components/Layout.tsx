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
  const { t } = useI18n();

  useEffect(() => { setSession(getSession()); }, []);

  const mw = { sm:'max-w-sm', md:'max-w-2xl', lg:'max-w-4xl', xl:'max-w-6xl', '2xl':'max-w-7xl', full:'max-w-full' }[maxWidth];

  return (
    <div className="min-h-screen flex flex-col pb-6">
      <nav className="border-b border-border bg-surface/60 backdrop-blur sticky top-7 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between">
          <Link href="/" className="font-mono text-xs text-accent hover:text-text transition-colors tracking-widest uppercase">
            {t('nav_mcb')}
          </Link>
          <div className="flex items-center gap-3 sm:gap-5 font-mono text-[10px] text-text-muted tracking-widest">
            <NavLink href="/lore"     label={t('nav_lore')}     active={pathname==='/lore'} />
            <NavLink href="/moonfall" label={t('nav_incident')} active={pathname==='/moonfall'} />
            <NavLink href="/apply"    label={t('nav_apply')}    active={pathname==='/apply'} />
            <NavLink href="/access"   label={t('nav_access')}   active={pathname==='/access'} />
            {session && <NavLink href={`/profile/${session.id}`} label={t('nav_profile')} active={pathname.startsWith('/profile')} />}
            {session && <NavLink href="/tasks" label={t('nav_tasks')} active={pathname.startsWith('/tasks')} />}
            {pathname.startsWith('/admin') && <NavLink href="/admin/tasks" label={t('nav_taskops')} active={pathname.startsWith('/admin/tasks')} />}
          </div>
          {session && (
            <button
              onClick={() => { clearSession(); window.location.href = '/access'; }}
              className="font-mono text-[10px] text-text-muted hover:text-red-400 transition-colors tracking-widest"
            >
              {t('nav_logout')}
            </button>
          )}
        </div>
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
    <Link
      href={href}
      className={`transition-colors tracking-widest ${active ? 'text-accent' : 'hover:text-text'}`}
    >
      {active ? `[${label}]` : label}
    </Link>
  );
}
