import liff from '@line/liff';

export default function SuccessScreen({ title, message }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-[#52B788] flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#52B788]">{title}</h2>
        <p className="text-[#B7E4C7] text-sm">{message}</p>
        <button
          onClick={() => liff.closeWindow()}
          className="w-full py-3 bg-[#52B788] text-white font-bold rounded-xl hover:bg-[#40a070] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
