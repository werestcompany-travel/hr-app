import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_ANNOUNCEMENTS || import.meta.env.VITE_LIFF_ID_HISTORY;

export default function Announcements() {
  const [appState, setAppState]       = useState('loading');
  const [errorMsg, setErrorMsg]       = useState('');
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => apiCall('/announcements'))
      .then(data => {
        setAnnouncements(data.announcements || []);
        setAppState('loaded');
      })
      .catch(err => {
        setErrorMsg(err.message);
        setAppState('error');
      });
  }, []);

  if (appState === 'loading') return <LoadingScreen message="Loading announcements..." />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;

  return (
    <div className="min-h-screen px-4 py-6 space-y-4 max-w-lg mx-auto">
      <div>
        <p className="text-xs text-[#52B788] font-semibold tracking-widest uppercase mb-1">Company</p>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#B7E4C7] opacity-60 text-sm">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div
              key={a.id}
              className={`rounded-2xl p-5 space-y-2 border-2 ${
                a.pinned
                  ? 'bg-[#2D6A4F] border-[#52B788]'
                  : 'bg-[rgba(45,106,79,0.4)] border-[rgba(82,183,136,0.15)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-white text-sm leading-snug">{a.title}</h2>
                {a.pinned && (
                  <span className="text-xs bg-[#52B788] text-white px-2 py-0.5 rounded-full shrink-0 font-medium">
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-[#B7E4C7] text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-[#B7E4C7] opacity-60">
                {a.users?.name && `${a.users.name} · `}
                {format(new Date(a.created_at), 'dd MMM yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
