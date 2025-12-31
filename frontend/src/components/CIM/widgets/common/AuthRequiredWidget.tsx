import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthRequiredWidgetProps {
  title: string;
  icon: string;
  message?: string;
}

/**
 * Gemeinsame Komponente für Widgets die Authentifizierung erfordern
 */
const AuthRequiredWidget: React.FC<AuthRequiredWidgetProps> = ({ 
  title, 
  icon, 
  message = 'Diese Daten erfordern eine Anmeldung' 
}) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className={`${icon} mr-2 text-blue-600 dark:text-blue-400`}></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
          <i className="ri-lock-line text-3xl text-yellow-600 dark:text-yellow-400"></i>
        </div>
        
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Anmeldung erforderlich
        </h4>
        
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {message}
        </p>

        <Button onClick={() => navigate('/login')}>
          Jetzt anmelden
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthRequiredWidget;
