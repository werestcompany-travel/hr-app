const COLOR_STYLES = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-100' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'bg-yellow-100' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-100' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   icon: 'bg-teal-100' },
};

export default function StatCard({ label, value, color = 'green', icon }) {
  const s = COLOR_STYLES[color] || COLOR_STYLES.green;
  return (
    <div className={`${s.bg} rounded-xl p-5 flex items-center gap-4`}>
      {icon && (
        <div className={`${s.icon} w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold ${s.text}`}>
          {value ?? <span className="text-gray-300 text-xl">—</span>}
        </p>
      </div>
    </div>
  );
}
