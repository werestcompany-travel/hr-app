import { useLang } from '../context/LangContext';

export default function LoadingScreen({ message }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#E2E8F2] border-t-[#364765] animate-spin mx-auto" />
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{message || t.loading}</p>
      </div>
    </div>
  );
}
