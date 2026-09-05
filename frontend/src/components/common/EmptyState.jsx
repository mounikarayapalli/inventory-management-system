import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching your request at this time.',
  icon: Icon = PackageOpen,
  action,
}) => {
  return (
    <div className="state-container">
      <div className="state-icon empty-icon">
        <Icon size={24} />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
