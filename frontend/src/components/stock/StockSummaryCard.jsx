import React from 'react';

export const StockSummaryCard = ({ label, value, subtext, icon: Icon, color = 'primary' }) => {
  return (
    <div className={`summary-card summary-card-${color}`}>
      <div className="summary-card-header">
        <span className="summary-card-label">{label}</span>
        {Icon && (
          <div className={`summary-card-icon summary-icon-${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="summary-card-body">
        <span className="summary-card-value">{value}</span>
        {subtext && <p className="summary-card-subtext">{subtext}</p>}
      </div>
    </div>
  );
};

export default StockSummaryCard;
