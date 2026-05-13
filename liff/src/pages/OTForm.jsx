import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_OT;
const OT_LIMIT = 36;

export default function OTForm() {
  const [appState, setAppState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [usage, setUsage]       = useState({ used: 0, remaining: OT_LIMIT });
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { date: '', hours: '', reason: '' },
  });

  const hours = parseFloat(watch('hours') || 0);
  const wouldExceed = usage.used + hours > OT_LIMIT;

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
        alert(`This would exceed the ${OT_LIMIT}hr monthly limit. You have ${usage.remaining.toFixed(1)} hours remaining.`);
        setSubmitting(false);
        return;
      }

      await apiCall('/ot', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setAppState('success');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (appState === 'loading') return <LoadingScreen message="Connecting to HR System..." />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;
  if (appState === 'success') {
    return (
      <SuccessScreen
        title="OT Request Submitted"
        message="Your manager has been notified and will review your request shortly."
      />
    );
  }

  const usedPercent = Math.min(100, (usage.used / OT_LIMIT) * 100);

  return (
    <div className="min-h-screen px-4 py-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#52B788]">OT Request</h1>
        <p className="text-sm text-[#B7E4C7]">Maximum 36 hours per month</p>
      </div>

      {/* Monthly usage bar */}
      <div className="bg-[#2D6A4F] rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#B7E4C7]">This month's OT</span>
          <span className="font-bold text-white">{usage.used.toFixed(1)} / {OT_LIMIT} hrs</span>
        </div>
        <div className="w-full bg-[#1B4332] rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all"
            style={{
              width: `${usedPercent}%`,
              backgroundColor: usedPercent > 80 ? '#FF3B30' : '#52B788',
            }}
          />
        </div>
        <p className="text-xs text-[#B7E4C7]">Remaining: {usage.remaining.toFixed(1)} hrs</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#B7E4C7]">OT Date *</label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none"
          />
          {errors.date && <p className="text-red-400 text-xs">{errors.date.message}</p>}
        </div>

        {/* Hours */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#B7E4C7]">Hours *</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            placeholder="e.g. 2.5"
            {...register('hours', {
              required: 'Hours is required',
              min: { value: 0.5, message: 'Minimum 0.5 hours' },
              max: { value: 12, message: 'Maximum 12 hours per day' },
            })}
            className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none"
          />
          {errors.hours && <p className="text-red-400 text-xs">{errors.hours.message}</p>}
          {!errors.hours && hours > 0 && (
            <p className={`text-xs ${wouldExceed ? 'text-red-400' : 'text-[#52B788]'}`}>
              {wouldExceed
                ? `⚠️ This would exceed the monthly limit by ${(usage.used + hours - OT_LIMIT).toFixed(1)} hrs`
                : `✓ After request: ${(usage.used + hours).toFixed(1)} / ${OT_LIMIT} hrs used`}
            </p>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#B7E4C7]">Reason *</label>
          <textarea
            {...register('reason', { required: 'Reason is required for OT requests' })}
            placeholder="Why is OT needed?"
            rows={3}
            className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none resize-none placeholder-[#B7E4C7] placeholder-opacity-50"
          />
          {errors.reason && <p className="text-red-400 text-xs">{errors.reason.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || wouldExceed}
          className="w-full py-4 bg-[#52B788] text-white font-bold rounded-xl text-base
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-[#40a070] active:bg-[#3a9060] transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit OT Request'}
        </button>
      </form>
    </div>
  );
}
