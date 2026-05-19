import liff from '@line/liff';
import { useLang } from '../context/LangContext';

export default function SuccessScreen({ title, message }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center min-h-screen px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-5" style={{ border: '1px solid var(--border)' }}>
          {/* Check icon */}
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--green-light)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              style={{ color: 'var(--green)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>
          </div>
          <button
            onClick={() => liff.closeWindow()}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-opacity active:opacity-80"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}
