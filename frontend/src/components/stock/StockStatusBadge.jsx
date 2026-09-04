import React from 'react';
import Badge from '../common/Badge';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export const StockStatusBadge = ({ status }) => {
  if (status === 'Out of Stock') {
    return (
      <Badge variant="error" icon={AlertOctagon}>
        Out of Stock
      </Badge>
    );
  }

  if (status === 'Low Stock') {
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
