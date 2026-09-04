import React from 'react';

export const LoadingState = ({ message = 'Loading contents...' }) => {
  return (
    <div className="state-container">
      <div className="loading-spinner" />
      <p className="state-description">{message}</p>
    </div>
  );
};

export default LoadingState;
