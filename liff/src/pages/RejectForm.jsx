import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import liff from '@line/liff';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import SuccessScreen from '../components/SuccessScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_REJECT;

export default function RejectForm() {
  const [appState, setAppState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [stepId, setStepId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const reason = watch('reason', '');

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => {
        // stepId is passed as a URL query param by the LINE webhook
        const params = new URLSearchParams(window.location.search);
        const id = params.get('stepId');

        if (!id) {
          setErrorMsg('Invalid URL. Missing stepId parameter. Please use the Reject button in LINE.');
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

  if (appState === 'loading') return <LoadingScreen message="Loading..." />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;
  if (appState === 'success') {
    return (
      <SuccessScreen
        title="Request Rejected"
        message="The employee has been notified with your reason."
      />
    );
  }

  const charCount = reason?.length || 0;
  const isValid = charCount >= 10;

  return (
    <div className="min-h-screen px-4 py-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-red-400">Reject Request</h1>
        <p className="text-sm text-[#B7E4C7]">
          The employee will receive your reason via LINE message.
        </p>
      </div>

      {/* Warning box */}
      <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4">
        <p className="text-red-300 text-sm font-medium">⚠️ This action cannot be undone.</p>
        <p className="text-red-300/70 text-xs mt-1">
          Once you submit, the employee will immediately be notified that their request has been rejected.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#B7E4C7]">
            Rejection Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            {...register('reason', {
              required: 'Reason is required',
              minLength: { value: 10, message: 'Please provide more detail (minimum 10 characters)' },
            })}
            placeholder="Please explain why this request is being rejected..."
            rows={5}
            className="w-full p-3 rounded-xl bg-[#2D6A4F] text-white border border-[rgba(82,183,136,0.3)] focus:border-red-400 focus:outline-none resize-none placeholder-[#B7E4C7] placeholder-opacity-50"
          />
          <div className="flex justify-between">
            {errors.reason
              ? <p className="text-red-400 text-xs">{errors.reason.message}</p>
              : <span />
            }
            <p className={`text-xs ${isValid ? 'text-[#52B788]' : 'text-[#B7E4C7] opacity-70'}`}>
              {charCount} chars {isValid ? '✓' : '(min 10)'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full py-4 bg-red-500 text-white font-bold rounded-xl text-base
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-red-600 active:bg-red-700 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Confirm Rejection'}
        </button>

        <button
          type="button"
          onClick={() => liff.closeWindow()}
          className="w-full py-3 bg-transparent border border-[rgba(82,183,136,0.3)] text-[#B7E4C7] rounded-xl text-sm hover:bg-[#2D6A4F] transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
