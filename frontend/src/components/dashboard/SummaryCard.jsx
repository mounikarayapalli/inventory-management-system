import React from 'react';
import {
  Package,
  Warehouse,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
} from 'lucide-react';

const iconMap = {
  Package,
  Warehouse,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
};

export const SummaryCard = ({ label, value, subtext, icon, color = 'primary' }) => {
  const IconComponent = iconMap[icon] || Package;

  return (
    <div className={`summary-card summary-card-${color}`}>
      <div className="summary-card-header">
        <span className="summary-card-label">{label}</span>
        <div className={`summary-card-icon summary-icon-${color}`}>
          <IconComponent size={20} />
        </div>
      </div>
      <div className="summary-card-body">
        <span className="summary-card-value">{value}</span>
        {subtext && <p className="summary-card-subtext">{subtext}</p>}
      </div>
    </div>
  );
};

export default SummaryCard;
