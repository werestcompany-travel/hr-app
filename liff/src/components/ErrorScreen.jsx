export default function ErrorScreen({ message }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-red-400 font-semibold">Something went wrong</p>
        <p className="text-[#B7E4C7] text-sm">{message}</p>
      </div>
    </div>
  );
}
