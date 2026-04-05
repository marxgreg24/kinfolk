import toast, { type Toast } from 'react-hot-toast'

// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT = {
  success: '#CDB53F',
  error:   '#A0522D',
  warning: '#CDB53F',
  neutral: 'rgba(255,255,255,0.22)',
} as const

const ICON = {
  success: '◆',
  error:   '✕',
  warning: '!',
  neutral: '◆',
} as const

type Variant = keyof typeof ACCENT

interface NotifyOptions {
  detail?:   string
  duration?: number
}

// ── Premium toast renderer ────────────────────────────────────────────────────
function ToastCard({
  t,
  message,
  variant,
  detail,
}: {
  t:       Toast
  message: string
  variant: Variant
  detail?: string
}) {
  const accent = ACCENT[variant]

  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'flex-start',
        gap:           '13px',
        background:    '#191918',
        border:        '1px solid rgba(255,255,255,0.06)',
        borderLeft:    `3px solid ${accent}`,
        borderRadius:  '10px',
        padding:       detail ? '15px 18px 15px 16px' : '13px 18px 13px 16px',
        boxShadow:     '0 16px 48px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.35)',
        maxWidth:      '380px',
        minWidth:      '260px',
        opacity:       t.visible ? 1 : 0,
        transform:     t.visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)',
        transition:    'opacity 180ms ease, transform 180ms ease',
        pointerEvents: 'auto',
      }}
    >
      {/* Accent icon */}
      <span
        style={{
          color:       accent,
          fontSize:    variant === 'error' ? '11px' : '9px',
          marginTop:   '3px',
          flexShrink:  0,
          fontFamily:  'Merriweather, serif',
          fontWeight:  'bold',
          lineHeight:  1,
        }}
      >
        {ICON[variant]}
      </span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin:     0,
            color:      'rgba(255,255,255,0.90)',
            fontSize:   '13px',
            lineHeight: '1.55',
            fontFamily: 'Merriweather, serif',
          }}
        >
          {message}
        </p>
        {detail && (
          <p
            style={{
              margin:     '7px 0 0',
              color:      'rgba(255,255,255,0.42)',
              fontSize:   '11.5px',
              lineHeight: '1.65',
              fontFamily: 'Merriweather, serif',
            }}
          >
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Public API ─────────────────────────────────────────────────────────────────
const notify = {
  success: (message: string, options?: NotifyOptions) =>
    toast.custom(
      (t) => <ToastCard t={t} message={message} variant="success" detail={options?.detail} />,
      { duration: options?.duration ?? 4000 },
    ),

  error: (message: string, options?: NotifyOptions) =>
    toast.custom(
      (t) => <ToastCard t={t} message={message} variant="error" detail={options?.detail} />,
      { duration: options?.duration ?? 5000 },
    ),

  warning: (message: string, options?: NotifyOptions) =>
    toast.custom(
      (t) => <ToastCard t={t} message={message} variant="warning" detail={options?.detail} />,
      { duration: options?.duration ?? 5000 },
    ),

  neutral: (message: string, options?: NotifyOptions) =>
    toast.custom(
      (t) => <ToastCard t={t} message={message} variant="neutral" detail={options?.detail} />,
      { duration: options?.duration ?? 3500 },
    ),
}

export default notify
