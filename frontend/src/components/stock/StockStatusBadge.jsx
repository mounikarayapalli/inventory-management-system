import React from 'react';
import Badge from '../common/Badge';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export const StockStatusBadge = ({ status }) => {
  const normStatus = String(status || '').toLowerCase().replace(/_/g, ' ');

  if (normStatus.includes('out')) {
    return (
      <Badge variant="error" icon={AlertOctagon}>
        Out of Stock
      </Badge>
    );
  }

  if (normStatus.includes('low')) {
    return (
      <Badge variant="warning" icon={AlertTriangle}>
        Low Stock
      </Badge>
    );
  }

  return (
    <Badge variant="success" icon={CheckCircle2}>
      In Stock
    </Badge>
  );
};

export default StockStatusBadge;
