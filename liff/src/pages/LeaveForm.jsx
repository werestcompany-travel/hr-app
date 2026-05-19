import { useEffect, useState } from 'react';
import { addDays, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns';
import { initLiff, apiCall } from '../api/client';
import { useLang } from '../context/LangContext';
import LangToggle from '../components/LangToggle';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_LEAVE;

const TYPE_STYLE = {
  sick:      { color: 'var(--green)',  colorLight: 'var(--green-light)' },
  vacation:  { color: '#3B7DD8',       colorLight: '#EBF2FF' },
  emergency: { color: 'var(--amber)',  colorLight: 'var(--amber-light)' },
  other:     { color: 'var(--slate)',  colorLight: '#F1F4F8' },
};

const TYPE_ICONS = {
  sick: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  vacation: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  emergency: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function LeaveForm() {
  const { t } = useLang();
  const [appState, setAppState]     = useState('loading');
  const [errorMsg, setErrorMsg]     = useState('');
  const [balance, setBalance]       = useState(null);
  const [step, setStep]             = useState(0);
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

  const visibleSteps = ['type', 'dates'];
  if (form.type === 'other' || form.type === 'sick' || form.type === '') visibleSteps.push('reason');
  visibleSteps.push('confirm');
  const currentStepName = visibleSteps[step] || 'confirm';

  const typeKeys = ['sick', 'vacation', 'emergency', 'other'];

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
        alert(t.alertEndDate);
        setSubmitting(false);
        return;
      }
      if (form.type === 'vacation' && isBefore(start, addDays(today, 3))) {
        alert(t.alertVacationNotice);
        setSubmitting(false);
        return;
      }
      if (needsMedicalCert && !uploadFile) {
        const ok = window.confirm(t.alertMedCert);
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

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;
  if (appState === 'success') {
    return (
      <SuccessScreen
        title={t.leaveSubmittedTitle}
        message={form.type === 'emergency' ? t.emergencyApprovedMsg : t.managerNotifiedMsg}
      />
    );
  }

  const selectedTypeCfg = t.types[form.type];
  const selectedStyle   = TYPE_STYLE[form.type];
  const balField = form.type === 'vacation'
    ? balance?.leave_balance_vacation
    : form.type === 'sick' ? balance?.leave_balance_sick : null;
  const balInsufficient = balField !== null && balField !== undefined && dayCount > balField;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Top bar */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {visibleSteps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                backgroundColor: i <= step ? 'var(--navy)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Balance chips */}
          {balance && (
            <div className="flex gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: 'var(--green-light)', color: 'var(--green)' }}>
                {t.sickChip(balance.leave_balance_sick)}
              </span>
              <span className="px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: '#EBF2FF', color: '#3B7DD8' }}>
                {t.vacationChip(balance.leave_balance_vacation)}
              </span>
            </div>
          )}
          <LangToggle variant="light" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-6 flex flex-col max-w-lg mx-auto w-full">

        {/* STEP: Leave Type */}
        {currentStepName === 'type' && (
          <div className="flex-1 space-y-5">
            <div className="pt-2 space-y-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                {t.leaveRequest}
              </p>
              <h2 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {t.whatTypeLeave}
              </h2>
            </div>
            <div className="space-y-3">
              {typeKeys.map(typeKey => {
                const cfg   = t.types[typeKey];
                const style = TYPE_STYLE[typeKey];
                const icon  = TYPE_ICONS[typeKey];
                const selected = form.type === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: typeKey }))}
                    className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all"
                    style={{
                      backgroundColor: selected ? style.colorLight : 'white',
                      border: `2px solid ${selected ? style.color : 'var(--border)'}`,
                      boxShadow: selected ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: style.colorLight, color: style.color }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                        {cfg.label}
                        <span className="ml-1.5 font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
                          {cfg.labelTh}
                        </span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cfg.desc}</p>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: style.color }}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: Dates */}
        {currentStepName === 'dates' && (
          <div className="flex-1 space-y-5">
            <div className="pt-2 space-y-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                {selectedTypeCfg?.label}
              </p>
              <h2 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {t.whenTimeOff}
              </h2>
            </div>

            {/* Notice banners */}
            {form.type === 'vacation' && (
              <Banner
                title={t.vacationBannerTitle}
                body={t.vacationBannerBody}
                bg="var(--amber-light)"
                border="#F59E0B33"
                titleColor="#92400E"
                bodyColor="#A16207"
              />
            )}
            {form.type === 'sick' && (
              <Banner
                title={t.sickBannerTitle}
                body={t.sickBannerBody}
                bg="#EBF2FF"
                border="#3B7DD833"
                titleColor="#1E40AF"
                bodyColor="#1D4ED8"
              />
            )}
            {form.type === 'emergency' && (
              <Banner
                title={t.emergencyBannerTitle}
                body={t.emergencyBannerBody}
                bg="var(--green-light)"
                border="#2DB07A33"
                titleColor="#065F46"
                bodyColor="#047857"
              />
            )}

            <div className="space-y-3">
              <DateCard label={t.startDate}>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full text-base focus:outline-none"
                  style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
                />
              </DateCard>

              <DateCard label={t.endDate}>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full text-base focus:outline-none"
                  style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
                />
              </DateCard>

              {dayCount > 0 && (
                <div className="bg-white rounded-2xl p-4 flex items-center justify-between"
                  style={{ border: `2px solid ${balInsufficient ? 'var(--red)' : 'var(--green)'}` }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>{t.duration}</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                      {dayCount}{' '}
                      <span className="text-base font-medium" style={{ color: 'var(--text-muted)' }}>
                        {dayCount === 1 ? t.day : t.days}
                      </span>
                    </p>
                  </div>
                  {balField !== null && balField !== undefined && (
                    <div className="text-right">
                      <p className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>{t.balance}</p>
                      <p className="text-sm font-bold mt-0.5"
                        style={{ color: balInsufficient ? 'var(--red)' : 'var(--green)' }}>
                        {balInsufficient
                          ? t.balInsufficient(balField, dayCount - balField)
                          : t.balSufficient(balField)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {balField !== null && balField !== undefined && dayCount > 0 && (
              <div className="bg-white rounded-2xl p-4 space-y-2"
                style={{ border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--slate)' }}>
                  <span>{t.leaveUsedAfter}</span>
                  <span>{Math.min(dayCount, balField)} / {balField + dayCount - Math.min(dayCount, balField)} {t.days}</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dayCount / (balField + dayCount)) * 100)}%`,
                      backgroundColor: balInsufficient ? 'var(--red)' : 'var(--green)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP: Reason / Medical cert */}
        {currentStepName === 'reason' && (
          <div className="flex-1 space-y-5">
            <div className="pt-2 space-y-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                {selectedTypeCfg?.label}
              </p>
              <h2 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {form.type === 'other' ? t.whatIsReason : t.additionalNotes}
              </h2>
              {needsMedicalCert && (
                <p className="text-sm pt-1" style={{ color: 'var(--text-muted)' }}>
                  {t.medCertRequired}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder={form.type === 'other' ? t.reasonPlaceholder : t.notesPlaceholder}
                  rows={5}
                  className="w-full p-4 resize-none focus:outline-none text-base"
                  style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
                />
              </div>

              {form.type === 'sick' && (
                <label className="flex items-center gap-4 bg-white rounded-2xl p-4 cursor-pointer active:opacity-80"
                  style={{ border: `2px dashed ${uploadFile ? 'var(--green)' : 'var(--border)'}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: uploadFile ? 'var(--green-light)' : '#F1F4F8' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      style={{ color: uploadFile ? 'var(--green)' : 'var(--slate)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {t.medCert}{' '}
                      {needsMedicalCert && <span style={{ color: 'var(--red)' }}>*</span>}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {uploadFile ? uploadFile.name : t.tapUpload}
                    </p>
                  </div>
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => setUploadFile(e.target.files[0] || null)} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP: Confirm */}
        {currentStepName === 'confirm' && (
          <div className="flex-1 space-y-5">
            <div className="pt-2 space-y-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                {t.review}
              </p>
              <h2 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {t.looksCorrect}
              </h2>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="px-5 py-4 flex items-center gap-4"
                style={{ backgroundColor: selectedStyle?.colorLight }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'white', color: selectedStyle?.color }}>
                  {TYPE_ICONS[form.type]}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{selectedTypeCfg?.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedTypeCfg?.labelTh}</p>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                <SummaryRow label={t.startDateLabel} value={form.start_date} />
                <SummaryRow label={t.endDateLabel}   value={form.end_date} />
                <SummaryRow
                  label={t.durationLabel}
                  value={`${dayCount} ${dayCount === 1 ? t.day : t.days}`}
                  highlight
                />
                {form.reason && <SummaryRow label={t.reasonLabel} value={form.reason} />}
                {uploadFile  && <SummaryRow label={t.certLabel}   value={uploadFile.name} />}
              </div>
            </div>

            {form.type === 'emergency' && (
              <div className="rounded-2xl p-4"
                style={{ backgroundColor: 'var(--green-light)', border: '1px solid #2DB07A33' }}>
                <p className="text-sm font-semibold" style={{ color: '#065F46' }}>
                  {t.emergencyNote}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 space-y-2.5">
          {currentStepName === 'confirm' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              {submitting ? t.submitting : t.submitLeave}
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
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity active:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              {t.continue}
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="w-full py-3 text-sm font-semibold"
              style={{ color: 'var(--slate)' }}
            >
              {t.back}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Banner({ title, body, bg, border, titleColor, bodyColor }) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: titleColor }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: bodyColor }}>{body}</p>
      </div>
    </div>
  );
}

function DateCard({ label, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-1.5"
      style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <label className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="px-5 py-3.5 flex justify-between items-start gap-4">
      <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm text-right font-medium"
        style={{ color: highlight ? 'var(--navy)' : 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}
