import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import liff from '@line/liff';
import { addDays, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';
import FileUpload from '../components/FileUpload';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_LEAVE;

const LEAVE_TYPES = [
  { value: 'sick',      label: '🤒 Sick Leave',       desc: 'Same day OK. Medical cert needed for 2+ days.' },
  { value: 'vacation',  label: '🌴 Vacation Leave',    desc: 'Must request at least 3 days in advance.' },
  { value: 'emergency', label: '🚨 Emergency Leave',   desc: 'Same day, auto-approved.' },
  { value: 'other',     label: '📝 Other',             desc: 'Requires a reason. Normal approval flow.' },
];

export default function LeaveForm() {
  const [appState, setAppState]   = useState('loading'); // loading | form | success | error
  const [errorMsg, setErrorMsg]   = useState('');
  const [balance, setBalance]     = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { type: '', start_date: '', end_date: '', reason: '' },
  });

  const leaveType = watch('type');
  const startDate = watch('start_date');
  const endDate   = watch('end_date');

  const dayCount = startDate && endDate
    ? differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1
    : 0;

  const needsMedicalCert = leaveType === 'sick' && dayCount >= 2;

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => apiCall('/leave/balance'))
      .then(data => {
        setBalance(data);
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
      const today = startOfDay(new Date());
      const start = new Date(data.start_date);
      const end   = new Date(data.end_date);

      // Client-side validation
      if (end < start) {
        alert('End date must be on or after start date.');
        setSubmitting(false);
        return;
      }

      if (data.type === 'vacation' && isBefore(start, addDays(today, 3))) {
        alert('Vacation leave must be requested at least 3 days in advance.');
        setSubmitting(false);
        return;
      }

      if (data.type === 'other' && !data.reason.trim()) {
        alert('Please provide a reason for Other leave type.');
        setSubmitting(false);
        return;
      }

      // If sick + 2+ days and no file, confirm
      if (needsMedicalCert && !uploadFile) {
        const ok = window.confirm(
          'A medical certificate is required for sick leave of 2 or more days.\n\nSubmit now and upload the certificate later?'
        );
        if (!ok) {
          setSubmitting(false);
          return;
        }
      }

      // Submit leave request
      const result = await apiCall('/leave', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Upload medical cert if provided
      if (uploadFile && result.request?.id) {
        const form = new FormData();
        form.append('file', uploadFile);
        await apiCall(`/leave/${result.request.id}/upload`, {
          method: 'POST',
          body: form,
        });
      }

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
        title="Leave Request Submitted"
        message={leaveType === 'emergency'
          ? 'Your emergency leave has been auto-approved.'
          : 'Your manager has been notified and will review your request shortly.'}
      />
    );
  }

  const selectedType = LEAVE_TYPES.find(t => t.value === leaveType);

  return (
    <div className="min-h-screen px-4 py-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#52B788]">Leave Request</h1>
        {balance && (
          <p className="text-sm text-[#B7E4C7]">
            Balance — 🤒 Sick: {balance.leave_balance_sick}d · 🌴 Vacation: {balance.leave_balance_vacation}d
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Leave Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#B7E4C7]">Leave Type *</label>
          <select
            {...register('type', { required: 'Please select a leave type' })}
            className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none"
          >
            <option value="">-- Select type --</option>
            {LEAVE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.type && <p className="text-red-400 text-xs">{errors.type.message}</p>}
          {selectedType && (
            <p className="text-xs text-[#B7E4C7] opacity-80 italic">{selectedType.desc}</p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#B7E4C7]">Start Date *</label>
            <input
              type="date"
              {...register('start_date', { required: 'Required' })}
              className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none"
            />
            {errors.start_date && <p className="text-red-400 text-xs">{errors.start_date.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#B7E4C7]">End Date *</label>
            <input
              type="date"
              {...register('end_date', { required: 'Required' })}
              className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none"
            />
            {errors.end_date && <p className="text-red-400 text-xs">{errors.end_date.message}</p>}
          </div>
        </div>
        {dayCount > 0 && (
          <p className="text-xs text-[#52B788]">Duration: {dayCount} day{dayCount !== 1 ? 's' : ''}</p>
        )}

        {/* Reason */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#B7E4C7]">
            Reason {leaveType === 'other' && <span className="text-red-400">*</span>}
          </label>
          <textarea
            {...register('reason')}
            placeholder={leaveType === 'other' ? 'Reason is required for Other leave' : 'Optional'}
            rows={3}
            className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-[#52B788] focus:outline-none resize-none placeholder-[#B7E4C7] placeholder-opacity-50"
          />
        </div>

        {/* Medical cert upload (sick + 2+ days) */}
        {leaveType === 'sick' && (
          <FileUpload
            label={needsMedicalCert ? 'Medical Certificate (required for 2+ days)' : 'Medical Certificate (optional)'}
            name="medicalCert"
            onChange={e => setUploadFile(e.target.files[0] || null)}
            required={false}
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-[#52B788] text-white font-bold rounded-xl text-base
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-[#40a070] active:bg-[#3a9060] transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
}
