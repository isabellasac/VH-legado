type BrandLogoProps = {
  subtitle?: string;
  inverse?: boolean;
  compact?: boolean;
  large?: boolean;
};

export function BrandLogo({
  subtitle = "Cuidado integrado e governança clínica",
  inverse = false,
  compact = false,
  large = false,
}: BrandLogoProps) {
  return (
    <div className={`brand-lockup${inverse ? " brand-lockup-inverse" : ""}${compact ? " brand-lockup-compact" : ""}${large ? " brand-lockup-large" : ""}`}>
      <div className="brand-mark brand-mark-icon" aria-hidden="true">
        <svg fill="none" height="32" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 27.2 6.85 18.63A6.34 6.34 0 0 1 5 14.16c0-4.02 3.18-7.16 7.05-7.16 1.97 0 3.83.8 5.1 2.2A6.9 6.9 0 0 1 22.25 7c3.86 0 6.75 3.14 6.75 7.15 0 1.8-.72 3.52-1.99 4.77L16 27.2Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
          <path
            d="M10 15.4h3.25l1.6-3.1 2.2 7.1 2.05-4h2.9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      </div>
      <div>
        <strong>CareOps VH</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
