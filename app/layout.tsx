/**
 * app/layout.tsx
 * Root layout — MCB System
 * Wires: scanlines, sound, realtime notifications, system chrome.
 */

import type { Metadata } from 'next';
import { Share_Tech_Mono, Rajdhani } from 'next/font/google';
import RealtimeToast from '@/components/RealtimeToast';
import SoundToggle   from '@/components/SoundToggle';
import SoundInit     from '@/components/SoundInit';
import { I18nProvider } from '@/lib/i18n';
import LangToggle from '@/components/LangToggle';
import SystemClock from '@/components/SystemClock';
import './globals.css';

const mono = Share_Tech_Mono({
  subsets:  ['latin'],
  weight:   '400',
  variable: '--font-mono',
});

const sans = Rajdhani({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title:       'MCB Internal System | Moonfall Containment Bureau',
  description: 'CLASSIFIED — Moonfall Containment Bureau Internal Personnel Database',
  robots:      'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable}`}>
      <body className="bg-bg text-text font-sans antialiased min-h-screen overflow-x-hidden">
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-scanlines opacity-30" />

        {/* Subtle moving scanline beam */}
        <div className="pointer-events-none fixed left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/20 to-transparent z-50 animate-scanline" />

        {/* Background grid */}
        <div className="pointer-events-none fixed inset-0 bg-grid-dark bg-grid-dark opacity-50" />

        {/* Corner decorations */}
        <div className="pointer-events-none fixed top-0 left-0 w-16 h-16 z-40">
          <div className="absolute top-2 left-2 w-6 h-6 border-t border-l border-accent/30" />
        </div>
        <div className="pointer-events-none fixed top-0 right-0 w-16 h-16 z-40">
          <div className="absolute top-2 right-2 w-6 h-6 border-t border-r border-accent/30" />
        </div>
        <div className="pointer-events-none fixed bottom-0 left-0 w-16 h-16 z-40">
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b border-l border-accent/30" />
        </div>
        <div className="pointer-events-none fixed bottom-0 right-0 w-16 h-16 z-40">
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-accent/30" />
        </div>

        <I18nProvider>
          {/* System status bar — top */}
          <div className="fixed top-0 left-0 right-0 z-40 h-7 bg-bg/80 backdrop-blur border-b border-border flex items-center justify-between px-6 font-mono text-[10px] text-text-muted">
            <span>MCB-SYS v4.2.1 // RESTRICTED ACCESS</span>
            <span className="hidden sm:flex items-center gap-4">
              <span className="text-green-400/70">■ UPLINK STABLE</span>
              <span>ENC: AES-256</span>
              <SoundToggle />
              <LangToggle />
              <SystemClock />
            </span>
          </div>

          <main className="pt-7">{children}</main>

          {/* Real-time broadcast notifications */}
          <RealtimeToast />

          {/* Sound engine initializer — wires global keypress sounds */}
          <SoundInit />

          {/* Footer bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 h-6 bg-bg/80 backdrop-blur border-t border-border flex items-center justify-between px-6 font-mono text-[10px] text-text-muted">
            <span>MOONFALL CONTAINMENT BUREAU // INTERNAL USE ONLY</span>
            <span className="hidden sm:block">CLASSIFICATION: TOP SECRET</span>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
