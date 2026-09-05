import React from 'react';
import Breadcrumbs from './Breadcrumbs';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className="page-header">
      <Breadcrumbs items={breadcrumbs} />
      <div className="page-header-top">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
