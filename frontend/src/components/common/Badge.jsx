import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  icon: Icon,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
