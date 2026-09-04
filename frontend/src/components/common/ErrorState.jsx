import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorState = ({
  title = 'An error occurred',
  message = 'Failed to fetch or display data. Please try again later.',
  onRetry,
}) => {
  return (
    <div className="state-container">
      <div className="state-icon error-icon">
        <AlertTriangle size={24} />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
