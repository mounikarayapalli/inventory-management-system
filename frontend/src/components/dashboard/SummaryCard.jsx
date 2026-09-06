import React from 'react';
import {
  Package,
  Warehouse,
  IndianRupee,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

const iconMap = {
  Package,
  Warehouse,
  IndianRupee,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  TrendingUp,
};

export const SummaryCard = ({ label, value, subtext, icon, color = 'primary', trend = '↑ 5%' }) => {
  const IconComponent = iconMap[icon] || Package;

  return (
    <div className={`summary-card summary-card-${color}`}>
      <div className="summary-card-header">
        <span className="summary-card-label">{label}</span>
        <div className={`summary-card-icon summary-icon-${color}`}>
          <IconComponent size={19} />
        </div>
      </div>
      
      <div className="summary-card-main">
        <span className="summary-card-value">{value}</span>
        {trend && (
          <span className={`trend-badge ${color === 'warning' || color === 'error' ? 'warning' : 'up'}`}>
            <TrendingUp size={11} />
            {trend}
          </span>
        )}
      </div>
      
      {subtext && <p className="summary-card-subtext">{subtext}</p>}
    </div>
  );
};

export default SummaryCard;
