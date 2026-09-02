export default function Logo({ size = 40, showText = true, textClass = '' }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0F2657" />
            <stop offset="1" stopColor="#2BC4A3" />
          </linearGradient>
        </defs>
        <path d="M24 4H40V24H60V40H40V60H24V40H4V24H24V4Z" fill="url(#logoGrad)" />
        <rect x="20" y="26" width="24" height="12" rx="6" transform="rotate(-45 32 32)" fill="white" />
        <rect x="20" y="26" width="12" height="12" rx="6" transform="rotate(-45 26 32)" fill="url(#logoGrad)" />
      </svg>
      {showText && (
        <span className={`font-display font-extrabold text-2xl ${textClass}`}>
          <span className="text-navy-900">Farma</span><span className="text-teal-500">.APP</span>
        </span>
      )}
    </div>
  );
}
