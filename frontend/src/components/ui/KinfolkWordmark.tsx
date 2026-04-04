interface KinfolkWordmarkProps {
  /** All text styling classes (size, weight, color, tracking, etc.) */
  className?: string
  /** Extra classes on the logo image */
  logoClassName?: string
  /** Render KINFOLK in uppercase (default false → Kinfolk) */
  uppercase?: boolean
}

/**
 * Renders "Kinfolk" with the logo image replacing the letter "o".
 * The image height is tied to the current font size via `em` units.
 */
const KinfolkWordmark = ({
  className = '',
  logoClassName = '',
  uppercase = false,
}: KinfolkWordmarkProps) => (
  <span className={`inline-flex items-center leading-none ${className}`}>
    {uppercase ? 'KINF' : 'Kinf'}
    <img
      src="/logo.png"
      alt="o"
      className={`h-[0.82em] w-auto ${logoClassName}`}
    />
    {uppercase ? 'LK' : 'lk'}
  </span>
)

export default KinfolkWordmark
