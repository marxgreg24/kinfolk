// ── Data ─────────────────────────────────────────────────────────────────────

const NODES = [
  // Gen 1 — patriarch
  { id: 'SK', x: 230, y: 52,  r: 28, bg: '#2C1810', name: 'Ssekamwa' },
  // Gen 2
  { id: 'NK', x: 108, y: 148, r: 22, bg: '#0D1A2C', name: 'Nakato'   },
  { id: 'MG', x: 352, y: 148, r: 22, bg: '#1A2C10', name: 'Mugisha'  },
  // Gen 3
  { id: 'AP', x: 40,  y: 238, r: 17, bg: '#2C1A05', name: 'Apio'     },
  { id: 'TD', x: 148, y: 238, r: 17, bg: '#1C0D2C', name: 'Tendo'    },
  { id: 'KZ', x: 284, y: 238, r: 17, bg: '#0D2C1C', name: 'Kizza'    },
  { id: 'NL', x: 412, y: 238, r: 17, bg: '#2C0D1C', name: 'Nalule'   },
  // Gen 4
  { id: 'BT', x: 15,  y: 322, r: 14, bg: '#1E1206', name: 'Batte'    },
  { id: 'NM', x: 72,  y: 322, r: 14, bg: '#06181E', name: 'Naomi'    },
  { id: 'SL', x: 210, y: 322, r: 14, bg: '#1E0606', name: 'Ssali'    },
  { id: 'KB', x: 330, y: 322, r: 14, bg: '#12061E', name: 'Kirabo'   },
  { id: 'NN', x: 412, y: 322, r: 14, bg: '#061E12', name: 'Nnakku'   },
]

const EDGES_DIRECT: [string, string][] = [
  ['SK','NK'], ['SK','MG'],
  ['NK','AP'], ['NK','TD'],
  ['MG','KZ'], ['MG','NL'],
  ['AP','BT'], ['AP','NM'],
  ['TD','SL'], ['KZ','KB'],
]

const EDGES_INFERRED: [string, string][] = [
  ['NL','NN'],
]

// Compute edge endpoints offset to circle boundaries
const ep = (fromId: string, toId: string) => {
  const p = NODES.find(n => n.id === fromId)!
  const c = NODES.find(n => n.id === toId)!
  const dx = c.x - p.x, dy = c.y - p.y
  const len = Math.sqrt(dx * dx + dy * dy)
  return {
    x1: p.x + p.r * dx / len, y1: p.y + p.r * dy / len,
    x2: c.x - c.r * dx / len, y2: c.y - c.r * dy / len,
  }
}

// Float animation assignment per node index
const FLOAT_KF = ['htFloat1', 'htFloat2', 'htFloat3']
const FLOAT_DUR = [4.2, 5.0, 4.6, 3.9, 5.3, 4.4, 4.9, 4.1, 5.2, 4.7, 3.8, 5.1]

// ── Component ─────────────────────────────────────────────────────────────────

const HeroTreeCard = () => (
  <>
    <style>{`
      @keyframes htTilt {
        0%,100% { transform: perspective(950px) rotateX(4deg) rotateY(-5deg) rotateZ(0.4deg); }
        33%      { transform: perspective(950px) rotateX(-2deg) rotateY(5deg) rotateZ(-0.4deg); }
        66%      { transform: perspective(950px) rotateX(3deg) rotateY(0deg) rotateZ(0.8deg); }
      }
      @keyframes htFloat1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
      @keyframes htFloat2 { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(7px)} }
      @keyframes htFloat3 { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-6px)} }
      @keyframes htDraw   { from{stroke-dashoffset:280} to{stroke-dashoffset:0} }
      @keyframes htPulse  { 0%,100%{r:32px;opacity:0.5} 50%{r:48px;opacity:0} }
      @keyframes htRootGlow {
        0%,100% { filter: drop-shadow(0 0 8px rgba(205,181,63,0.6)); }
        50%     { filter: drop-shadow(0 0 24px rgba(205,181,63,1)); }
      }
      @keyframes htOrbit {
        from { transform: rotate(0deg) translateX(58px) rotate(0deg); }
        to   { transform: rotate(360deg) translateX(58px) rotate(-360deg); }
      }
      @keyframes htNodeGlow {
        0%,100% { filter: drop-shadow(0 0 4px rgba(205,181,63,0.3)); }
        50%     { filter: drop-shadow(0 0 10px rgba(205,181,63,0.65)); }
      }

      .ht-scene   { animation: htTilt 11s ease-in-out infinite; transform-style: preserve-3d; }
      .ht-root    { animation: htFloat1 4.2s ease-in-out infinite, htRootGlow 3s ease-in-out infinite;
                    transform-box: fill-box; transform-origin: center; }
      .ht-pulse   { animation: htPulse 3.2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
      .ht-orbit   { animation: htOrbit 13s linear infinite; transform-box: fill-box; transform-origin: 230px 52px; }
      .ht-line    { stroke-dasharray: 280; animation: htDraw 1.8s cubic-bezier(.4,0,.2,1) forwards; }
      .ht-node-glow { animation: htNodeGlow 4s ease-in-out infinite; }
    `}</style>

    <div className="ht-scene relative w-full max-w-[480px] lg:max-w-[520px]">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 blur-3xl opacity-35 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 65% at 48% 45%, rgba(205,181,63,0.3) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 460 360"
        className="w-full relative"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Filters */}
          <filter id="htNodeShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#000" floodOpacity="0.5" />
          </filter>
          <filter id="htLineGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="htRingGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Gold gradient for rings */}
          <linearGradient id="htGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0D060" />
            <stop offset="50%" stopColor="#CDB53F" />
            <stop offset="100%" stopColor="#A08020" />
          </linearGradient>
        </defs>

        {/* ── Direct edges ── */}
        {EDGES_DIRECT.map(([from, to], i) => {
          const { x1, y1, x2, y2 } = ep(from, to)
          return (
            <line
              key={`de-${from}-${to}`}
              className="ht-line"
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="url(#htGold)" strokeWidth="1.4" strokeLinecap="round"
              style={{ animationDelay: `${0.08 + i * 0.18}s`, filter: 'url(#htLineGlow)' }}
            />
          )
        })}

        {/* ── Inferred edges (dashed amber) ── */}
        {EDGES_INFERRED.map(([from, to], i) => {
          const { x1, y1, x2, y2 } = ep(from, to)
          return (
            <line
              key={`ie-${from}-${to}`}
              className="ht-line"
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#A0522D" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="5 4"
              style={{ animationDelay: `${1.9 + i * 0.2}s`, filter: 'url(#htLineGlow)' }}
            />
          )
        })}

        {/* ── Orbit particle around root ── */}
        <circle className="ht-orbit" cx={230} cy={52} r={3} fill="#CDB53F" opacity={0.75} />

        {/* ── Nodes ── */}
        {NODES.map((n, i) => {
          const isRoot = i === 0
          const floatKf = FLOAT_KF[i % 3]
          const dur = FLOAT_DUR[i]
          const delay = -(i * 0.65) % 5

          return (
            <g
              key={n.id}
              style={{
                animation: isRoot
                  ? undefined
                  : `${floatKf} ${dur}s ease-in-out infinite`,
                animationDelay: isRoot ? undefined : `${delay}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
              className={isRoot ? 'ht-root' : 'ht-node-glow'}
            >
              {/* Pulse ring on root only */}
              {isRoot && (
                <circle className="ht-pulse" cx={n.x} cy={n.y} r={n.r + 4}
                  fill="none" stroke="#CDB53F" strokeWidth="1" opacity={0.5} />
              )}

              {/* Background circle */}
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.bg}
                style={{ filter: 'url(#htNodeShadow)' }} />

              {/* Initial */}
              <text
                x={n.x} y={n.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isRoot ? 13 : i < 3 ? 10.5 : i < 7 ? 8.5 : 7}
                fill="#CDB53F"
                fontFamily="Georgia, serif"
                fontWeight="bold"
                letterSpacing="0.5"
              >
                {n.name[0]}
              </text>

              {/* Gold ring border */}
              <circle
                cx={n.x} cy={n.y} r={n.r}
                fill="none"
                stroke={isRoot ? 'url(#htGold)' : '#CDB53F'}
                strokeWidth={isRoot ? 2.5 : i < 3 ? 1.8 : 1.4}
                style={{ filter: 'url(#htRingGlow)' }}
              />

              {/* Inner decorative ring on root */}
              {isRoot && (
                <circle cx={n.x} cy={n.y} r={n.r - 6}
                  fill="none" stroke="#CDB53F" strokeWidth="0.6" opacity={0.35} />
              )}

              {/* Name label */}
              <text
                x={n.x} y={n.y + n.r + 11}
                textAnchor="middle"
                fontSize={isRoot ? 8.5 : i < 3 ? 7.5 : 6.5}
                fill="rgba(205,181,63,0.75)"
                fontFamily="Georgia, serif"
                letterSpacing="0.5"
              >
                {n.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  </>
)

export default HeroTreeCard
