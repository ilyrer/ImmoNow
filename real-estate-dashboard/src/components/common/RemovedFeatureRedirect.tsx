import React from 'react';
import { Navigate } from 'react-router-dom';

interface RemovedFeatureRedirectProps {
  featureName: string;
  redirectTo?: string;
}

export const RemovedFeatureRedirect: React.FC<RemovedFeatureRedirectProps> = ({ 
  featureName, 
  redirectTo = "/" 
}) => {
  // Log that user tried to access removed feature
  console.log(`User attempted to access removed feature: ${featureName}`);
  
  // Show temporary notice (could be stored in localStorage for toast notification)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('removedFeatureNotice', JSON.stringify({
      feature: featureName,
      timestamp: new Date().toISOString()
    }));
  }
  
  return <Navigate to={redirectTo} replace />;
};
