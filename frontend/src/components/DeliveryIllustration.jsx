export default function DeliveryIllustration() {
  return (
    <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-xl">
      {/* Pharmacy shelf backdrop */}
      <svg viewBox="0 0 600 320" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="shelfBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EAF3FB" />
            <stop offset="1" stopColor="#D6E9F5" />
          </linearGradient>
        </defs>
        <rect width="600" height="320" fill="url(#shelfBg)" />
        {[40, 110, 180].map((y) => (
          <g key={y}>
            <rect x="0" y={y} width="600" height="6" fill="#B9D3E6" />
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={i} x={20 + i * 58} y={y - 34} width="26" height="34" rx="3"
                fill={['#17A98C', '#0F2657', '#2BC4A3', '#E4483D'][i % 4]} opacity="0.55" />
            ))}
          </g>
        ))}
        <rect x="0" y="250" width="600" height="70" fill="#153270" />
        <text x="300" y="292" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="26" fill="white">FARM&#193;CIA</text>
      </svg>

      {/* Delivery courier */}
      <svg viewBox="0 0 300 320" className="absolute bottom-0 left-6 w-44 h-72">
        <ellipse cx="150" cy="308" rx="90" ry="10" fill="#0A1B45" opacity="0.15" />
        {/* legs */}
        <rect x="120" y="210" width="20" height="80" rx="8" fill="#0F2657" />
        <rect x="160" y="210" width="20" height="80" rx="8" fill="#0F2657" />
        {/* torso - polo shirt */}
        <path d="M100 120 Q150 95 200 120 L210 220 Q150 240 90 220 Z" fill="#153270" />
        <rect x="118" y="150" width="64" height="34" rx="6" fill="white" opacity="0.9" />
        {/* cross logo on shirt */}
        <rect x="140" y="158" width="20" height="6" fill="#17A98C" />
        <rect x="147" y="151" width="6" height="20" fill="#17A98C" />
        {/* arms */}
        <rect x="70" y="140" width="24" height="80" rx="12" fill="#153270" transform="rotate(18 82 180)" />
        <rect x="206" y="140" width="24" height="80" rx="12" fill="#153270" transform="rotate(-18 218 180)" />
        {/* head */}
        <circle cx="150" cy="90" r="34" fill="#E8B08A" />
        {/* cap */}
        <path d="M112 82 Q150 48 188 82 L188 70 Q150 40 112 70 Z" fill="#0F2657" />
        <rect x="108" y="78" width="84" height="14" rx="7" fill="#17A98C" />
        {/* box */}
        <rect x="95" y="200" width="110" height="80" rx="6" fill="#C98A4E" />
        <rect x="95" y="200" width="110" height="20" fill="#B87A3E" />
        <rect x="140" y="200" width="20" height="80" fill="#B87A3E" />
        <circle cx="150" cy="238" r="16" fill="white" />
        <path d="M142 238h16M150 230v16" stroke="#17A98C" strokeWidth="3" />
      </svg>
    </div>
  );
}
