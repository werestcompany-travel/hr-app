import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import liff from '@line/liff';
import { initLiff, apiCall } from '../api/client';
import { useLang } from '../context/LangContext';
import LangToggle from '../components/LangToggle';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_REJECT;

export default function RejectForm() {
  const { t } = useLang();
  const [appState, setAppState]     = useState('loading');
  const [errorMsg, setErrorMsg]     = useState('');
  const [stepId, setStepId]         = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const reason = watch('reason', '');
  const charCount = reason?.length || 0;
  const isValid = charCount >= 10;

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('stepId');
        if (!id) {
          setErrorMsg(t.invalidUrl);
          setAppState('error');
          return;
        }
        setStepId(id);
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
      await apiCall('/approval/reject', {
        method: 'POST',
        body: JSON.stringify({ stepId, reason: data.reason }),
      });
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
    return <SuccessScreen title={t.rejectSuccessTitle} message={t.rejectSuccessMsg} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase opacity-60 text-white mb-1">
              {t.managerAction}
            </p>
            <h1 className="text-2xl font-bold text-white">{t.rejectRequest}</h1>
            <p className="text-sm opacity-70 text-white mt-1">{t.rejectSubtitle}</p>
          </div>
          <LangToggle variant="dark" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-5 pb-8 space-y-4 max-w-lg mx-auto w-full">

        {/* Warning card */}
        <div className="bg-white rounded-2xl p-4 flex items-start gap-3"
          style={{ border: '1px solid #FCA5A5', backgroundColor: 'var(--red-light)' }}>
          <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--red)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>{t.cannotBeUndone}</p>
            <p className="text-xs mt-0.5" style={{ color: '#B91C1C' }}>{t.notifiedImmediately}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

          <div className="bg-white rounded-2xl overflow-hidden"
            style={{
              border: errors.reason ? '2px solid var(--red)' : '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
            <div className="px-4 pt-4 pb-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--slate)' }}>
                {t.rejectionReasonLabel} <span style={{ color: 'var(--red)' }}>*</span>
              </label>
            </div>
            <textarea
              {...register('reason', {
                required: t.validReasonRejectRequired,
                minLength: { value: 10, message: t.validReasonRejectMin },
              })}
              placeholder={t.rejectionPlaceholder}
              rows={5}
              className="w-full px-4 pb-3 text-base focus:outline-none resize-none"
              style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
            />
            <div className="px-4 pb-3 flex justify-between items-center">
              {errors.reason
                ? <p className="text-xs" style={{ color: 'var(--red)' }}>{errors.reason.message}</p>
                : <span />
              }
              <p className="text-xs font-semibold ml-auto"
                style={{ color: isValid ? 'var(--green)' : 'var(--text-muted)' }}>
                {t.charMin(charCount)} {isValid && '✓'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity active:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--red)' }}
          >
            {submitting ? t.submitting : t.confirmRejection}
          </button>

          <button
            type="button"
            onClick={() => liff.closeWindow()}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors active:opacity-70"
            style={{ color: 'var(--slate)', backgroundColor: 'white', border: '1px solid var(--border)' }}
          >
            {t.cancel}
          </button>
        </form>
      </div>
    </div>
  );
}
