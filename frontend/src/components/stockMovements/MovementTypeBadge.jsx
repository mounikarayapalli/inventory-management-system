import React from 'react';
import Badge from '../common/Badge';
import {
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Sliders,
} from 'lucide-react';

const movementConfig = {
  OPENING: { variant: 'primary', icon: Archive, label: 'OPENING' },
  INWARD: { variant: 'success', icon: ArrowDownLeft, label: 'INWARD' },
  OUTWARD: { variant: 'warning', icon: ArrowUpRight, label: 'OUTWARD' },
  RETURN: { variant: 'info', icon: RotateCcw, label: 'RETURN' },
  ADJUSTMENT: { variant: 'neutral', icon: Sliders, label: 'ADJUSTMENT' },
};

export const MovementTypeBadge = ({ type }) => {
  const config = movementConfig[type] || {
    variant: 'neutral',
    icon: Sliders,
    label: type,
  };

  return (
    <Badge variant={config.variant} icon={config.icon}>
      {config.label}
    </Badge>
  );
};

export default MovementTypeBadge;
