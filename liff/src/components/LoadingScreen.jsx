export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#52B788] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#B7E4C7] text-sm">{message}</p>
      </div>
    </div>
  );
}
