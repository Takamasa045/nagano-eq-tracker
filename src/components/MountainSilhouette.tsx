/**
 * 北アルプス・北信山岳のシルエット（イメージ）。
 * 左から: 白馬三山 → 鹿島槍 → 立山 → 乗鞍 → 戸隠
 * 厳密な稜線ではなく、装飾用のステライズドな山並み。
 */
export function MountainSilhouette() {
  return (
    <svg
      className="alps-silhouette"
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="distant" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8aa1b6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8aa1b6" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="middle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d6f86" stopOpacity="0.85" />
          <stop offset="1" stopColor="#5d6f86" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4659" stopOpacity="0.95" />
          <stop offset="1" stopColor="#3a4659" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* 遠景（うっすら） */}
      <path
        fill="url(#distant)"
        d="M0,180 L50,140 L110,160 L160,110 L200,140 L240,90 L290,130 L340,80 L380,120 L430,70 L480,110 L530,60 L590,100 L640,55 L700,95 L760,70 L820,110 L880,80 L940,120 L1000,90 L1060,130 L1120,100 L1200,140 L1200,240 L0,240 Z"
      />

      {/* 中景 */}
      <path
        fill="url(#middle)"
        d="M0,210 L40,190 L90,205 L140,170 L190,200 L240,150 L290,195 L340,160 L390,200 L440,140 L490,180 L540,120 L600,170 L660,110 L720,160 L780,135 L830,175 L890,150 L940,185 L1000,160 L1060,190 L1120,175 L1200,200 L1200,240 L0,240 Z"
      />

      {/* 近景 + 雪冠（白） */}
      <path
        fill="url(#near)"
        d="M0,235 L60,225 L120,230 L180,210 L240,225 L300,200 L360,220 L430,195 L490,215 L560,190 L630,210 L700,180 L770,205 L840,195 L910,215 L980,200 L1050,220 L1120,210 L1200,220 L1200,240 L0,240 Z"
      />

      {/* 主要峰の雪冠ハイライト */}
      <g fill="#f4ede0" opacity="0.7">
        <path d="M425,196 L432,200 L430,196 L433,193 L437,196 Z" />
        <path d="M555,191 L562,195 L560,191 L563,188 L567,191 Z" />
        <path d="M695,181 L702,185 L700,181 L703,178 L707,181 Z" />
      </g>

      {/* 山名ラベル（小さく） */}
      <g fill="#3a4659" fontSize="9" fontFamily="serif" letterSpacing="0.1em" opacity="0.7">
        <text x="425" y="186">白馬</text>
        <text x="555" y="181">鹿島槍</text>
        <text x="695" y="171">立山</text>
      </g>
    </svg>
  );
}
