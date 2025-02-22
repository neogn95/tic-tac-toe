import React from 'react';

interface ErrorProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorProps> = ({ error }) => {
  return (
    <>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </>
  );
};

export default ErrorDisplay;
