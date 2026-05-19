import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { initLiff, apiCall } from '../api/client';
import { useLang } from '../context/LangContext';
import LangToggle from '../components/LangToggle';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_OT;
const OT_LIMIT = 36;

export default function OTForm() {
  const { t } = useLang();
  const [appState, setAppState]     = useState('loading');
  const [errorMsg, setErrorMsg]     = useState('');
  const [usage, setUsage]           = useState({ used: 0, remaining: OT_LIMIT });
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { date: '', hours: '', reason: '' },
  });

  const hours = parseFloat(watch('hours') || 0);
  const wouldExceed = usage.used + hours > OT_LIMIT;
  const projectedUsed = Math.min(OT_LIMIT, usage.used + (hours > 0 ? hours : 0));
  const usedPct = Math.min(100, (usage.used / OT_LIMIT) * 100);
  const projectedPct = Math.min(100, (projectedUsed / OT_LIMIT) * 100);

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => apiCall('/ot/monthly-usage'))
      .then(data => {
        setUsage(data);
        setAppState('form');
      })
      .catch(err => {
        setErrorMsg(err.message);
        setAppState('error');
      });
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (wouldExceed) {
        alert(t.alertExceedsLimit(OT_LIMIT, usage.remaining.toFixed(1)));
        setSubmitting(false);
        return;
      }
      await apiCall('/ot', { method: 'POST', body: JSON.stringify(data) });
      setAppState('success');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;
  if (appState === 'success') {
    return <SuccessScreen title={t.otSubmittedTitle} message={t.otSubmittedMsg} />;
  }

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase opacity-60 text-white mb-1">
              {t.overtimeRequest}
            </p>
            <h1 className="text-2xl font-bold text-white">{t.otHours}</h1>
            <p className="text-sm opacity-70 text-white mt-1">{t.maxPerMonth(OT_LIMIT)}</p>
          </div>
          <LangToggle variant="dark" />
        </div>
      </div>

      <div className="px-5 -mt-2 space-y-4 max-w-lg mx-auto">

        {/* Usage card */}
        <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm"
          style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.thisMonth}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                {usage.used.toFixed(1)}
                <span className="text-base font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
                  / {OT_LIMIT} {t.hrsUnit}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.remaining}</p>
              <p className="text-lg font-bold mt-0.5" style={{
                color: usage.remaining <= 4 ? 'var(--red)' : 'var(--green)'
              }}>
                {usage.remaining.toFixed(1)} {t.hrsUnit}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${projectedPct}%`,
                  backgroundColor: wouldExceed ? 'var(--red)' : usedPct > 80 ? 'var(--amber)' : 'var(--navy)',
                }}
              />
            </div>
            {hours > 0 && !wouldExceed && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t.afterRequest((usage.used + hours).toFixed(1))}
              </p>
            )}
          </div>

          {wouldExceed && hours > 0 && (
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ backgroundColor: 'var(--red-light)', border: '1px solid #EF444433' }}>
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--red)' }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs font-medium" style={{ color: 'var(--red)' }}>
                {t.exceedsLimit((usage.used + hours - OT_LIMIT).toFixed(1))}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

          {/* Date */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm"
            style={{ border: errors.date ? '2px solid var(--red)' : '1px solid var(--border)' }}>
            <div className="px-4 pt-4 pb-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>{t.otDateLabel}</label>
            </div>
            <input
              type="date"
              {...register('date', { required: t.validDateRequired })}
              className="w-full px-4 pb-4 text-base focus:outline-none"
              style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
            />
            {errors.date && (
              <p className="px-4 pb-3 text-xs" style={{ color: 'var(--red)' }}>{errors.date.message}</p>
            )}
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm"
            style={{ border: errors.hours || wouldExceed ? '2px solid var(--red)' : '1px solid var(--border)' }}>
            <div className="px-4 pt-4 pb-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>{t.hoursLabel}</label>
            </div>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              placeholder={t.hoursPlaceholder}
              {...register('hours', {
                required: t.validHoursRequired,
                min: { value: 0.5, message: t.validMinHours },
                max: { value: 12, message: t.validMaxHours },
              })}
              className="w-full px-4 pb-4 text-base focus:outline-none"
              style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
            />
            {errors.hours && (
              <p className="px-4 pb-3 text-xs" style={{ color: 'var(--red)' }}>{errors.hours.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm"
            style={{ border: errors.reason ? '2px solid var(--red)' : '1px solid var(--border)' }}>
            <div className="px-4 pt-4 pb-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>{t.reasonOTLabel}</label>
            </div>
            <textarea
              {...register('reason', { required: t.validReasonRequired })}
              placeholder={t.reasonOTPlaceholder}
              rows={3}
              className="w-full px-4 pb-4 text-base focus:outline-none resize-none"
              style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
            />
            {errors.reason && (
              <p className="px-4 pb-3 text-xs" style={{ color: 'var(--red)' }}>{errors.reason.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || wouldExceed}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity active:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            {submitting ? t.submitting : t.submitOT}
          </button>
        </form>
      </div>
    </div>
  );
}
