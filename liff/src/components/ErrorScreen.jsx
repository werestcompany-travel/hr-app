export default function ErrorScreen({ message }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-400 font-semibold">Something went wrong</p>
        <p className="text-[#B7E4C7] text-sm">{message}</p>
      </div>
    </div>
  );
}
