import React from 'react';

export const CaliboLogo = ({
  size = 'md',
  showText = true,
  subtitle = null,
  variant = 'auto',
  className = '',
}) => {
  let sizePx = 40;
  if (size === 'sm') sizePx = 28;
  if (size === 'md') sizePx = 40;
  if (size === 'lg') sizePx = 56;
  if (size === 'xl') sizePx = 76;
  if (typeof size === 'number') sizePx = size;

  const textClass =
    variant === 'light'
      ? 'calibo-logo-text-light'
      : variant === 'dark'
      ? 'calibo-logo-text-dark'
      : 'calibo-logo-text-auto';

  return (
    <div className={`calibo-logo-component ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: sizePx > 40 ? '0.85rem' : '0.65rem' }}>
      {/* Official Calibo SVG Emblem */}
      <svg
        viewBox="0 0 300 300"
        width={sizePx}
        height={sizePx}
        style={{ flexShrink: 0 }}
        aria-label="Calibo Logo Emblem"
      >
        <defs>
          <linearGradient id={`navyGrad-${sizePx}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2B88" />
            <stop offset="100%" stopColor="#141E61" />
          </linearGradient>
          <linearGradient id={`tealGrad-${sizePx}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B4A2" />
            <stop offset="100%" stopColor="#008375" />
          </linearGradient>
        </defs>

        {/* Outer Ring 'C' embracing inner 'a' */}
        <path
          d="M 150 25 A 125 125 0 1 0 250 215 L 205 185 A 75 75 0 1 1 150 75 A 75 75 0 0 1 215 115 L 258 85 A 125 125 0 0 0 150 25 Z"
          fill={`url(#navyGrad-${sizePx})`}
        />
        {/* Inner Circle 'a' Core */}
        <circle cx="150" cy="150" r="45" fill={`url(#navyGrad-${sizePx})`} />
        {/* Calibo Teal Leaf / Teardrop Accent */}
        <path
          d="M 215 150 C 215 110, 260 115, 265 150 C 260 185, 215 190, 215 150 Z"
          fill={`url(#tealGrad-${sizePx})`}
        />
      </svg>

      {/* Brand Text Labels */}
      {showText && (
        <div className={`calibo-logo-brand-block ${textClass}`}>
          <div
            className="calibo-logo-brand-name"
            style={{
              fontSize: sizePx > 40 ? '1.5rem' : sizePx > 30 ? '1.15rem' : '0.95rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Calibo <span className="calibo-teal-accent">Inventory</span>
          </div>
          {subtitle && (
            <div
              className="calibo-logo-subtitle"
              style={{
                fontSize: sizePx > 40 ? '0.825rem' : '0.725rem',
                fontWeight: 500,
                marginTop: '2px',
                opacity: 0.85,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaliboLogo;
