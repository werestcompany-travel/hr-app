import { useLang } from '../context/LangContext';

export default function ErrorScreen({ message }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center min-h-screen px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-5" style={{ border: '1px solid var(--border)' }}>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--red-light)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              style={{ color: 'var(--red)' }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{t.somethingWrong}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
