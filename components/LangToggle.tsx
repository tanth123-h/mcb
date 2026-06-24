'use client';
import { useI18n } from '@/lib/i18n';

export default function LangToggle() {
  const { lang, toggleLang, t } = useI18n();

  return (
    <button
      onClick={toggleLang}
      title={lang === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
      className="
        font-mono text-[10px] tracking-widest
        border border-accent/30 px-2 py-0.5 rounded-sm
        text-accent/70 hover:text-accent hover:border-accent/60
        transition-colors duration-150 select-none
        flex items-center gap-1
      "
    >
      <span className="text-[9px] opacity-60">⇌</span>
      {t('lang_toggle')}
    </button>
  );
}
