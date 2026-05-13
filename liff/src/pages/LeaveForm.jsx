import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { addDays, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_LEAVE;

const LEAVE_TYPES = [
  { value: 'sick',      label: 'Sick Leave',      desc: 'Same day OK. Medical cert needed for 2+ days.' },
  { value: 'vacation',  label: 'Vacation Leave',   desc: 'Must request at least 3 days in advance.' },
  { value: 'emergency', label: 'Emergency Leave',  desc: 'Same day, auto-approved.' },
  { value: 'other',     label: 'Other',            desc: 'Requires a reason. Normal approval flow.' },
];

const STEPS = ['type', 'dates', 'reason', 'confirm'];

export default function LeaveForm() {
  const [appState, setAppState]   = useState('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const [balance, setBalance]     = useState(null);
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const [form, setForm] = useState({
    type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const dayCount = form.start_date && form.end_date
    ? differenceInCalendarDays(new Date(form.end_date), new Date(form.start_date)) + 1
    : 0;

  const needsMedicalCert = form.type === 'sick' && dayCount >= 2;
  const selectedType = LEAVE_TYPES.find(t => t.value === form.type);

  const totalSteps = form.type === 'sick' ? 4 : (form.type === 'other' ? 4 : 3);

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

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const canAdvanceStep0 = form.type !== '';
  const canAdvanceStep1 = form.start_date !== '' && form.end_date !== '' && dayCount > 0;
  const canAdvanceStep2 = form.type !== 'other' || form.reason.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const today = startOfDay(new Date());
      const start = new Date(form.start_date);
      const end   = new Date(form.end_date);

      if (end < start) {
        alert('End date must be on or after start date.');
        setSubmitting(false);
        return;
      }

      if (form.type === 'vacation' && isBefore(start, addDays(today, 3))) {
        alert('Vacation leave must be requested at least 3 days in advance.');
        setSubmitting(false);
        return;
      }

      if (needsMedicalCert && !uploadFile) {
        const ok = window.confirm(
          'A medical certificate is required for 2+ days of sick leave.\n\nSubmit now and upload later?'
        );
        if (!ok) { setSubmitting(false); return; }
      }

      const result = await apiCall('/leave', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (uploadFile && result.request?.id) {
        const fd = new FormData();
        fd.append('file', uploadFile);
        await apiCall(`/leave/${result.request.id}/upload`, { method: 'POST', body: fd });
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
        message={form.type === 'emergency'
          ? 'Your emergency leave has been auto-approved.'
          : 'Your manager has been notified and will review your request shortly.'}
      />
    );
  }

  // Compute display step index skipping reason step for non-other/sick
  const visibleSteps = ['type', 'dates'];
  if (form.type === 'other' || form.type === 'sick' || form.type === '') visibleSteps.push('reason');
  visibleSteps.push('confirm');
  const currentStepName = visibleSteps[step] || 'confirm';
  const progress = ((step) / (visibleSteps.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#2D6A4F]">
        <div
          className="h-1 bg-[#52B788] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs text-[#B7E4C7] font-medium tracking-widest uppercase">
          Step {step + 1} of {visibleSteps.length}
        </span>
        {balance && (
          <div className="flex gap-3 text-xs">
            <span className="text-[#52B788] font-semibold">
              ลาป่วย <span className="text-white">{balance.leave_balance_sick}</span> วัน
            </span>
            <span className="text-[#3B82F6] font-semibold">
              พักร้อน <span className="text-white">{balance.leave_balance_vacation}</span> วัน
            </span>
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col justify-between max-w-lg mx-auto w-full">

        {/* STEP: Leave Type */}
        {currentStepName === 'type' && (
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-xs text-[#52B788] font-semibold tracking-widest uppercase mb-2">Leave Request</p>
              <h2 className="text-2xl font-bold text-white leading-snug">What type of leave are you requesting?</h2>
            </div>
            <div className="space-y-3">
              {LEAVE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    form.type === t.value
                      ? 'border-[#52B788] bg-[#2D6A4F]'
                      : 'border-[rgba(82,183,136,0.2)] bg-[rgba(45,106,79,0.3)]'
                  }`}
                >
                  <p className="font-semibold text-white text-sm">{t.label}</p>
                  <p className="text-xs text-[#B7E4C7] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Dates */}
        {currentStepName === 'dates' && (
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-xs text-[#52B788] font-semibold tracking-widest uppercase mb-2">{selectedType?.label}</p>
              <h2 className="text-2xl font-bold text-white leading-snug">When do you need time off?</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#B7E4C7]">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full p-4 rounded-2xl bg-[#2D6A4F] text-white border-2 border-[rgba(82,183,136,0.2)] focus:border-[#52B788] focus:outline-none text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#B7E4C7]">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full p-4 rounded-2xl bg-[#2D6A4F] text-white border-2 border-[rgba(82,183,136,0.2)] focus:border-[#52B788] focus:outline-none text-base"
                />
              </div>
              {dayCount > 0 && (
                <div className="bg-[#2D6A4F] rounded-2xl p-4 text-center">
                  <p className="text-[#52B788] font-bold text-2xl">{dayCount}</p>
                  <p className="text-[#B7E4C7] text-xs mt-0.5">day{dayCount !== 1 ? 's' : ''} off</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP: Reason / Medical cert */}
        {currentStepName === 'reason' && (
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-xs text-[#52B788] font-semibold tracking-widest uppercase mb-2">{selectedType?.label}</p>
              <h2 className="text-2xl font-bold text-white leading-snug">
                {form.type === 'other' ? 'What is the reason?' : 'Any additional notes?'}
              </h2>
              {needsMedicalCert && (
                <p className="text-sm text-[#B7E4C7] mt-2">A medical certificate is required for 2+ days. You can upload it now or later.</p>
              )}
            </div>
            <div className="space-y-4">
              <textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder={form.type === 'other' ? 'Please describe your reason...' : 'Optional note for your manager...'}
                rows={4}
                className="w-full p-4 rounded-2xl bg-[#2D6A4F] text-white border-2 border-[rgba(82,183,136,0.2)] focus:border-[#52B788] focus:outline-none resize-none placeholder-[#B7E4C7] text-base"
              />
              {form.type === 'sick' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#B7E4C7]">
                    Medical Certificate {needsMedicalCert ? '(required)' : '(optional)'}
                  </label>
                  <label className="flex items-center justify-center w-full p-4 rounded-2xl border-2 border-dashed border-[rgba(82,183,136,0.4)] cursor-pointer hover:border-[#52B788] transition-colors">
                    <span className="text-sm text-[#B7E4C7]">
                      {uploadFile ? uploadFile.name : 'Tap to upload image or PDF'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={e => setUploadFile(e.target.files[0] || null)}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP: Confirm */}
        {currentStepName === 'confirm' && (
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-xs text-[#52B788] font-semibold tracking-widest uppercase mb-2">Review</p>
              <h2 className="text-2xl font-bold text-white leading-snug">Does everything look correct?</h2>
            </div>
            <div className="bg-[#2D6A4F] rounded-2xl p-5 space-y-4">
              <Row label="Leave Type" value={selectedType?.label} />
              <Row label="Start Date" value={form.start_date} />
              <Row label="End Date"   value={form.end_date} />
              <Row label="Duration"   value={`${dayCount} day${dayCount !== 1 ? 's' : ''}`} />
              {form.reason && <Row label="Reason" value={form.reason} />}
              {uploadFile  && <Row label="Certificate" value={uploadFile.name} />}
            </div>
            {form.type === 'emergency' && (
              <p className="text-sm text-[#52B788] font-medium">This emergency leave will be auto-approved immediately.</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 space-y-3">
          {currentStepName === 'confirm' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-[#52B788] text-white font-bold rounded-2xl text-base disabled:opacity-50 active:bg-[#3a9060] transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={
                (currentStepName === 'type'   && !canAdvanceStep0) ||
                (currentStepName === 'dates'  && !canAdvanceStep1) ||
                (currentStepName === 'reason' && !canAdvanceStep2)
              }
              className="w-full py-4 bg-[#52B788] text-white font-bold rounded-2xl text-base disabled:opacity-40 active:bg-[#3a9060] transition-colors"
            >
              Continue
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="w-full py-3 text-[#B7E4C7] text-sm font-medium"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[#B7E4C7] text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  );
}
