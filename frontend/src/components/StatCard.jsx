export default function StatCard({ label, value, icon, accent = '#52B788', sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + '1A' }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800 leading-none">
          {value ?? <span className="text-gray-300">—</span>}
        </p>
        <p className="text-sm text-gray-500 mt-1 truncate">{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: accent }}>{sub}</p>}
      </div>
    </div>
  );
}
