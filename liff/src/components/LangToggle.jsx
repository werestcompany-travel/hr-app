import { useLang } from '../context/LangContext';

/**
 * variant="light"  — for the light top-bar (LeaveForm)
 * variant="dark"   — for navy headers (OTForm, History, Balance, RejectForm)
 */
export default function LangToggle({ variant = 'dark' }) {
  const { lang, toggle } = useLang();

  const isDark = variant === 'dark';

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-0.5 rounded-full px-1 py-1 transition-opacity active:opacity-70"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'var(--border)',
        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
      }}
      title="Switch language / เปลี่ยนภาษา"
    >
      <span
        className="px-2 py-0.5 rounded-full text-xs font-bold transition-all"
        style={{
          backgroundColor: lang === 'th'
            ? (isDark ? 'white' : 'var(--navy)')
            : 'transparent',
          color: lang === 'th'
            ? (isDark ? 'var(--navy)' : 'white')
            : (isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'),
        }}
      >
        TH
      </span>
      <span
        className="px-2 py-0.5 rounded-full text-xs font-bold transition-all"
        style={{
          backgroundColor: lang === 'en'
            ? (isDark ? 'white' : 'var(--navy)')
            : 'transparent',
          color: lang === 'en'
            ? (isDark ? 'var(--navy)' : 'white')
            : (isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'),
        }}
      >
        EN
      </span>
    </button>
  );
}
